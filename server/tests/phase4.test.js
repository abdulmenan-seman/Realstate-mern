import http from "http";
import app from "../index.js";
import User from "../models/User.model.js";
import Property from "../models/Property.model.js";
import Inquiry from "../models/Inquiry.model.js";
import Appointment from "../models/Appointment.model.js";
import PropertyReport from "../models/PropertyReport.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const runPhase4Tests = async () => {
    console.log("\n=======================================================");
    console.log("       REALESTATEHUB PHASE 4 VERIFICATION TESTS       ");
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
        const hashedPassword = await bcrypt.hash("password123", 10);

        // 1. Setup users: Owner 1, Owner 2, Customer 1, Admin
        const owner1 = new User({
            username: `p4owner1_${timestamp}`,
            email: `p4owner1_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await owner1.save();
        const owner1Token = jwt.sign({ id: owner1._id, role: "owner" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const owner1Headers = { "Content-Type": "application/json", Authorization: `Bearer ${owner1Token}` };

        const owner2 = new User({
            username: `p4owner2_${timestamp}`,
            email: `p4owner2_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await owner2.save();
        const owner2Token = jwt.sign({ id: owner2._id, role: "owner" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const owner2Headers = { "Content-Type": "application/json", Authorization: `Bearer ${owner2Token}` };

        const customer = new User({
            username: `p4cust_${timestamp}`,
            email: `p4cust_${timestamp}@example.com`,
            password: hashedPassword,
            role: "customer",
            accountStatus: "active",
        });
        await customer.save();
        const customerToken = jwt.sign({ id: customer._id, role: "customer" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const customerHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${customerToken}` };

        const admin = new User({
            username: `p4admin_${timestamp}`,
            email: `p4admin_${timestamp}@example.com`,
            password: hashedPassword,
            role: "admin",
            accountStatus: "active",
        });
        await admin.save();
        const adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET || "fallback_secret_realestatehub");
        const adminHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` };

        // 2. Setup Properties:
        // Approved Property owned by Owner 1
        const propApproved = new Property({
            title: `Beachfront Villa ${timestamp}`,
            description: "Approved luxury villa for inquiries and viewings.",
            propertyType: "villa",
            listingType: "sale",
            price: 1200000,
            currency: "USD",
            location: { city: "Malibu", area: "West Coast", address: "100 Ocean Way" },
            specifications: { bedrooms: 4, bathrooms: 3, areaSqm: 300 },
            images: [{ publicId: "p4_img1", secureUrl: "http://example.com/p4_1.jpg", isCover: true }],
            owner: owner1._id,
            approvalStatus: "approved",
            availabilityStatus: "available",
        });
        await propApproved.save();

        // Pending Property owned by Owner 1
        const propPending = new Property({
            title: `Unapproved Cabin ${timestamp}`,
            description: "Pending moderation.",
            propertyType: "house",
            listingType: "sale",
            price: 250000,
            currency: "USD",
            location: { city: "Aspen", area: "North Hills" },
            specifications: { areaSqm: 100 },
            images: [{ publicId: "p4_img2", secureUrl: "http://example.com/p4_2.jpg", isCover: true }],
            owner: owner1._id,
            approvalStatus: "pending",
            availabilityStatus: "available",
        });
        await propPending.save();

        // -------------------------------------------------------------
        // MODULE 1 TESTS: INQUIRIES
        // -------------------------------------------------------------
        // Test 1: Customer submits an inquiry on approved property
        const inquiryRes = await fetch(`${baseUrl}/api/inquiries`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                message: "Hello, I am interested in this villa. Is the price negotiable?",
                contactPhone: "555-0199",
            }),
        });
        const inquiryData = await inquiryRes.json();
        assert(inquiryRes.status === 201 && inquiryData.success, "1. Customer can submit an inquiry on an approved property");
        assert(inquiryData.inquiry.owner.toString() === owner1._id.toString(), "2. Owner ID is derived from the property record");

        const inquiryId = inquiryData.inquiry._id;

        // Test 2: Inquiring on unapproved property is rejected
        const badInqRes = await fetch(`${baseUrl}/api/inquiries`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propPending._id,
                message: "Trying to inquire on unapproved listing.",
            }),
        });
        assert(badInqRes.status === 400, "3. Inquiring on unapproved property is rejected with 400");

        // Test 3: Owner cannot inquire on their own property
        const selfInqRes = await fetch(`${baseUrl}/api/inquiries`, {
            method: "POST",
            headers: owner1Headers,
            body: JSON.stringify({
                propertyId: propApproved._id,
                message: "Self inquiry attempt.",
            }),
        });
        assert(selfInqRes.status === 400, "4. Owner cannot inquire on their own property");

        // Test 4: Customer views their submitted inquiries
        const myInqRes = await fetch(`${baseUrl}/api/inquiries/mine`, {
            headers: customerHeaders,
        });
        const myInqData = await myInqRes.json();
        assert(myInqRes.status === 200 && myInqData.data.some((i) => i._id === inquiryId), "5. Customer can view their submitted inquiries");

        // Test 5: Owner 1 views received inquiries for their property
        const recvInqRes = await fetch(`${baseUrl}/api/inquiries/received`, {
            headers: owner1Headers,
        });
        const recvInqData = await recvInqRes.json();
        assert(recvInqRes.status === 200 && recvInqData.data.some((i) => i._id === inquiryId), "6. Owner receives inquiries sent to their property");

        // Test 6: Owner 2 cannot view Owner 1's inquiry
        const idorInqRes = await fetch(`${baseUrl}/api/inquiries/${inquiryId}`, {
            headers: owner2Headers,
        });
        assert(idorInqRes.status === 403, "7. Owner cannot access inquiries belonging to another owner (returns 403)");

        // Test 7: Owner responds to inquiry
        const respondRes = await fetch(`${baseUrl}/api/inquiries/${inquiryId}/status`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({
                ownerResponse: "Yes, we are open to reasonable offers. Please call me.",
            }),
        });
        const respondData = await respondRes.json();
        assert(respondRes.status === 200 && respondData.inquiry.status === "responded", "8. Owner can respond to inquiry and status changes to 'responded'");
        assert(respondData.inquiry.ownerResponse.includes("reasonable offers"), "9. Owner response text is saved correctly");

        // -------------------------------------------------------------
        // MODULE 2 TESTS: APPOINTMENTS
        // -------------------------------------------------------------
        // Test 8: Past appointment date is rejected
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const pastApptRes = await fetch(`${baseUrl}/api/appointments`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                requestedDateTime: pastDate,
            }),
        });
        assert(pastApptRes.status === 400, "10. Past appointment date is rejected with 400");

        // Test 9: Customer requests valid future appointment
        const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const apptRes = await fetch(`${baseUrl}/api/appointments`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                requestedDateTime: futureDate,
                note: "Would love to see the master bedroom and patio.",
            }),
        });
        const apptData = await apptRes.json();
        assert(apptRes.status === 201 && apptData.appointment.status === "pending", "11. Customer can request viewing appointment with future date");

        const appointmentId = apptData.appointment._id;

        // Test 10: Duplicate active appointment request for identical slot is prevented
        const dupApptRes = await fetch(`${baseUrl}/api/appointments`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                requestedDateTime: futureDate,
            }),
        });
        assert(dupApptRes.status === 409, "12. Duplicate active appointment request for same slot is prevented with 409");

        // Test 11: Owner receives appointment request
        const ownerApptsRes = await fetch(`${baseUrl}/api/appointments/received`, {
            headers: owner1Headers,
        });
        const ownerApptsData = await ownerApptsRes.json();
        assert(ownerApptsRes.status === 200 && ownerApptsData.data.some((a) => a._id === appointmentId), "13. Owner receives appointment requests for their property");

        // Test 12: Owner accepts appointment
        const acceptApptRes = await fetch(`${baseUrl}/api/appointments/${appointmentId}/status`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({
                status: "accepted",
                ownerNote: "Looking forward to meeting you at the property.",
            }),
        });
        const acceptApptData = await acceptApptRes.json();
        assert(acceptApptRes.status === 200 && acceptApptData.appointment.status === "accepted", "14. Owner can accept viewing appointment");

        // Test 13: Invalid status transition (e.g. accepted back to pending) is rejected
        const invalidTransRes = await fetch(`${baseUrl}/api/appointments/${appointmentId}/status`, {
            method: "PATCH",
            headers: owner1Headers,
            body: JSON.stringify({ status: "pending" }),
        });
        assert(invalidTransRes.status === 400, "15. Invalid appointment status transition is rejected with 400");

        // Test 14: Customer cancels their eligible appointment
        const cancelApptRes = await fetch(`${baseUrl}/api/appointments/${appointmentId}/cancel`, {
            method: "PATCH",
            headers: customerHeaders,
        });
        const cancelApptData = await cancelApptRes.json();
        assert(cancelApptRes.status === 200 && cancelApptData.appointment.status === "cancelled", "16. Customer can cancel their eligible appointment");

        // -------------------------------------------------------------
        // MODULE 3 TESTS: REPORTS
        // -------------------------------------------------------------
        // Test 15: Customer reports property
        const reportRes = await fetch(`${baseUrl}/api/reports`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                reason: "incorrect_information",
                description: "The square meters listed might be larger than actual.",
            }),
        });
        const reportData = await reportRes.json();
        assert(reportRes.status === 201 && reportData.report.status === "open", "17. Customer can submit a property report");

        const reportId = reportData.report._id;

        // Test 16: Duplicate open report for same property is prevented
        const dupReportRes = await fetch(`${baseUrl}/api/reports`, {
            method: "POST",
            headers: customerHeaders,
            body: JSON.stringify({
                propertyId: propApproved._id,
                reason: "suspicious_listing",
            }),
        });
        assert(dupReportRes.status === 409, "18. Duplicate open report by same user for same property is rejected with 409");

        // Test 17: Report does NOT automatically hide the property
        const propCheck = await Property.findById(propApproved._id);
        assert(propCheck.approvalStatus === "approved" && propCheck.availabilityStatus === "available", "19. Submitting a report does NOT automatically hide property");

        // Test 18: Customer retrieves their submitted reports
        const myReportsRes = await fetch(`${baseUrl}/api/reports/mine`, {
            headers: customerHeaders,
        });
        const myReportsData = await myReportsRes.json();
        assert(myReportsRes.status === 200 && myReportsData.data.some((r) => r._id === reportId), "20. Customer can retrieve their submitted reports");

        // Test 19: Admin retrieves reports
        const adminReportsRes = await fetch(`${baseUrl}/api/admin/reports`, {
            headers: adminHeaders,
        });
        const adminReportsData = await adminReportsRes.json();
        assert(adminReportsRes.status === 200 && adminReportsData.data.some((r) => r._id === reportId), "21. Admin can list all property reports");

        // Test 20: Admin updates report status to resolved
        const modReportRes = await fetch(`${baseUrl}/api/admin/reports/${reportId}`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({
                status: "resolved",
                adminNote: "Verified with owner blueprints; specifications are accurate.",
            }),
        });
        const modReportData = await modReportRes.json();
        assert(modReportRes.status === 200 && modReportData.report.status === "resolved", "22. Admin can resolve report with administrative notes");

        console.log(`\n=======================================================`);
        console.log(`PHASE 4 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
        console.log(`=======================================================\n`);

        server.close();
        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (err) {
        console.error("Phase 4 test execution failed:", err);
        server.close();
        process.exit(1);
    }
};

runPhase4Tests();
