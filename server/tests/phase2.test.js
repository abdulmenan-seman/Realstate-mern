import http from "http";
import app from "../index.js";
import User from "../models/User.model.js";
import Property from "../models/Property.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const runPhase2Tests = async () => {
    console.log("\n=======================================================");
    console.log("       REALESTATEHUB PHASE 2 VERIFICATION TESTS       ");
    console.log("=======================================================\n");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    let totalTests = 0;
    let passedTests = 0;

    const assert = (condition, testName) => {
        totalTests++;
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passedTests++;
        } else {
            console.error(`❌ [FAIL] ${testName}`);
        }
    };

    try {
        const timestamp = Date.now();

        // 1. Setup Test Users: Owner 1, Owner 2, Customer, Admin
        const hashedPassword = await bcrypt.hash("password123", 10);

        const ownerUser1 = new User({
            username: `owner1_${timestamp}`,
            email: `owner1_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await ownerUser1.save();
        const owner1Token = jwt.sign({ id: ownerUser1._id, role: "owner" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const owner1Headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${owner1Token}`,
        };

        const ownerUser2 = new User({
            username: `owner2_${timestamp}`,
            email: `owner2_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await ownerUser2.save();
        const owner2Token = jwt.sign({ id: ownerUser2._id, role: "owner" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const owner2Headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${owner2Token}`,
        };

        const customerUser = new User({
            username: `cust_${timestamp}`,
            email: `cust_${timestamp}@example.com`,
            password: hashedPassword,
            role: "customer",
            accountStatus: "active",
        });
        await customerUser.save();
        const customerToken = jwt.sign({ id: customerUser._id, role: "customer" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const customerHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
        };

        const adminUser = new User({
            username: `admin_${timestamp}`,
            email: `admin_${timestamp}@example.com`,
            password: hashedPassword,
            role: "admin",
            accountStatus: "active",
        });
        await adminUser.save();
        const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const adminHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
        };

        // Test 1: Customer cannot create property
        const custCreateRes = await fetch(`${baseUrl}/api/properties`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                title: "Unauthorized listing",
                description: "Test description",
                propertyType: "apartment",
                listingType: "sale",
                price: 100000,
                location: { city: "New York", area: "Manhattan" },
                specifications: { areaSqm: 80 },
                images: [{ publicId: "mock1", secureUrl: "http://example.com/img1.jpg" }],
            }),
        });
        assert(custCreateRes.status === 403, "1. Customer cannot create property (returns 403)");

        // Test 2: Owner creates property with valid data
        const propertyPayload = {
            title: "Luxury Penthouse Suite",
            description: "Spacious luxury penthouse with skyline views and rooftop access.",
            propertyType: "apartment",
            listingType: "sale",
            price: 750000,
            currency: "USD",
            location: {
                city: "Metropolis",
                area: "Downtown",
                address: "123 Skyview Blvd",
            },
            specifications: {
                bedrooms: 3,
                bathrooms: 2,
                areaSqm: 180,
                parking: true,
                furnished: "furnished",
            },
            images: [
                { publicId: "img_pent_1", secureUrl: "http://example.com/pent1.jpg", isCover: true },
                { publicId: "img_pent_2", secureUrl: "http://example.com/pent2.jpg" },
            ],
            // Malicious attempts to self-approve or assign wrong owner
            approvalStatus: "approved",
            owner: adminUser._id,
        };

        const createRes = await fetch(`${baseUrl}/api/properties`, {
            method: "POST",
            headers: owner1Headers,
            body: JSON.stringify(propertyPayload),
        });
        const createData = await createRes.json();
        assert(createRes.status === 201 && createData.success, "2. Owner can successfully create a property listing");
        assert(createData.property.approvalStatus === "pending", "3. Newly created property strictly starts in 'pending' status");
        assert(createData.property.owner.toString() === ownerUser1._id.toString(), "4. Property owner is derived from authenticated token, not payload");

        const propertyId = createData.property._id;

        // Test 3: Public user cannot view pending property
        const publicGetRes = await fetch(`${baseUrl}/api/properties/${propertyId}`);
        assert(publicGetRes.status === 404, "5. Public cannot view unapproved pending property (returns 404)");

        // Test 4: Owner can view their own pending property
        const ownerGetRes = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
            headers: owner1Headers,
        });
        const ownerGetData = await ownerGetRes.json();
        assert(ownerGetRes.status === 200 && ownerGetData.property._id === propertyId, "6. Owner can view their own pending property");

        // Test 5: Owner retrieves their own property list
        const myPropsRes = await fetch(`${baseUrl}/api/properties/mine`, {
            headers: owner1Headers,
        });
        const myPropsData = await myPropsRes.json();
        assert(myPropsRes.status === 200 && myPropsData.data.some((p) => p._id === propertyId), "7. Owner can retrieve their own property list");

        // Test 6: Admin pending queue lists the pending property
        const pendingQueueRes = await fetch(`${baseUrl}/api/admin/properties/pending`, {
            headers: adminHeaders,
        });
        const pendingQueueData = await pendingQueueRes.json();
        assert(pendingQueueRes.status === 200 && pendingQueueData.data.some((p) => p._id === propertyId), "8. Admin pending queue includes the pending property");

        // Test 7: Admin rejection requires a mandatory reason
        const rejectNoReasonRes = await fetch(`${baseUrl}/api/admin/properties/${propertyId}/review`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ action: "reject", rejectionReason: "" }),
        });
        assert(rejectNoReasonRes.status === 400, "9. Admin rejection without reason is rejected with 400");

        // Test 8: Admin rejects property with clear reason
        const rejectRes = await fetch(`${baseUrl}/api/admin/properties/${propertyId}/review`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({
                action: "reject",
                rejectionReason: "Title and description do not match the uploaded photos.",
            }),
        });
        const rejectData = await rejectRes.json();
        assert(rejectRes.status === 200 && rejectData.property.approvalStatus === "rejected", "10. Admin can reject property with clear reason");
        assert(rejectData.property.rejectionReason.length > 5, "11. Rejection reason is saved on the property record");

        // Test 9: Owner edits rejected property -> resets to pending
        const editRes = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({
                title: "Updated Luxury Penthouse Suite",
                description: "Updated description matching exact verified photos.",
            }),
        });
        const editData = await editRes.json();
        assert(editRes.status === 200 && editData.property.approvalStatus === "pending", "12. Owner editing a rejected property returns it to 'pending' review");

        // Test 10: Admin approves property
        const approveRes = await fetch(`${baseUrl}/api/admin/properties/${propertyId}/review`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ action: "approve" }),
        });
        const approveData = await approveRes.json();
        assert(approveRes.status === 200 && approveData.property.approvalStatus === "approved", "13. Admin can approve property listing");

        // Test 11: Approved and available property is now publicly discoverable
        const publicFindRes = await fetch(`${baseUrl}/api/properties/${propertyId}`);
        const publicFindData = await publicFindRes.json();
        assert(publicFindRes.status === 200 && publicFindData.property.title.includes("Penthouse"), "14. Approved property is accessible via public GET /api/properties/:id");

        const publicSearchRes = await fetch(`${baseUrl}/api/properties?city=Metropolis`);
        const publicSearchData = await publicSearchRes.json();
        assert(publicSearchRes.status === 200 && publicSearchData.data.some((p) => p._id === propertyId), "15. Approved property appears in public search results");

        // Test 12: Other Owner CANNOT edit this owner's property
        const badOwnerEdit = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
            method: "PATCH",
            headers: owner2Headers,
            body: JSON.stringify({ price: 100 }),
        });
        assert(badOwnerEdit.status === 403, "16. Owner cannot modify another owner's property (returns 403)");

        // Test 13: Owner updates availability to 'sold'
        const availRes = await fetch(`${baseUrl}/api/properties/${propertyId}/availability`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({ availabilityStatus: "sold" }),
        });
        const availData = await availRes.json();
        assert(availRes.status === 200 && availData.property.availabilityStatus === "sold", "17. Owner can mark property as sold");

        // Test 14: Sold property is excluded from public available search
        const soldPublicSearch = await fetch(`${baseUrl}/api/properties?city=Metropolis`);
        const soldSearchData = await soldPublicSearch.json();
        assert(!soldSearchData.data.some((p) => p._id === propertyId), "18. Sold property is excluded from public available property search");

        // Reset to available for next test
        await Property.findByIdAndUpdate(propertyId, { availabilityStatus: "available", approvalStatus: "approved" });

        // Test 15: Material edit to an approved property resets it to pending review
        const materialEditRes = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({ price: 799000 }),
        });
        const materialEditData = await materialEditRes.json();
        assert(materialEditRes.status === 200 && materialEditData.property.approvalStatus === "pending", "19. Material edit to approved property returns it to 'pending' review");

        // Test 16: Owner can delete/archive property
        const deleteRes = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
            method: "DELETE",
            headers: owner1Headers,
        });
        assert(deleteRes.status === 200, "20. Owner can archive/delete their property");

        const archivedCheck = await Property.findById(propertyId);
        assert(archivedCheck.isArchived === true, "21. Deleted property is marked isArchived: true");

        console.log(`\n=======================================================`);
        console.log(`PHASE 2 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
        console.log(`=======================================================\n`);

        server.close();
        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (err) {
        console.error("Phase 2 test execution failed:", err);
        server.close();
        process.exit(1);
    }
};

runPhase2Tests();
