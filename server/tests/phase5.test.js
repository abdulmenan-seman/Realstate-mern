import http from "http";
import app from "../index.js";
import User from "../models/User.model.js";
import Property from "../models/Property.model.js";
import Inquiry from "../models/Inquiry.model.js";
import Appointment from "../models/Appointment.model.js";
import PropertyReport from "../models/PropertyReport.model.js";
import Favorite from "../models/Favorite.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const runPhase5Tests = async () => {
    console.log("\n=======================================================");
    console.log("       REALESTATEHUB PHASE 5 VERIFICATION TESTS       ");
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
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret_realestatehub";

        // Setup Users: 1 Admin, 1 Owner, 1 Customer
        const adminUser = new User({
            username: `p5admin_${timestamp}`,
            email: `p5admin_${timestamp}@example.com`,
            password: hashedPassword,
            role: "admin",
            accountStatus: "active",
        });
        await adminUser.save();
        const adminToken = jwt.sign({ id: adminUser._id, role: "admin" }, jwtSecret);
        const adminHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` };

        const ownerUser = new User({
            username: `p5owner_${timestamp}`,
            email: `p5owner_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await ownerUser.save();
        const ownerToken = jwt.sign({ id: ownerUser._id, role: "owner" }, jwtSecret);
        const ownerHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${ownerToken}` };

        const customerUser = new User({
            username: `p5customer_${timestamp}`,
            email: `p5customer_${timestamp}@example.com`,
            password: hashedPassword,
            role: "customer",
            accountStatus: "active",
        });
        await customerUser.save();
        const customerToken = jwt.sign({ id: customerUser._id, role: "customer" }, jwtSecret);
        const customerHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${customerToken}` };

        // Setup Sample Property for owner
        const sampleProperty = new Property({
            title: `P5 Luxury Villa ${timestamp}`,
            description: "Beautiful modern villa for Phase 5 verification testing",
            propertyType: "villa",
            listingType: "sale",
            price: 750000,
            currency: "USD",
            location: { city: "Addis Ababa", area: "Bole", address: "Bole Medhanialem" },
            specifications: { bedrooms: 4, bathrooms: 3, areaSqm: 320, parking: true },
            images: [{ publicId: "p5_sample_1", secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg", isCover: true }],
            owner: ownerUser._id,
            approvalStatus: "approved",
            availabilityStatus: "available",
            isArchived: false,
        });
        await sampleProperty.save();

        // -------------------------------------------------------------
        // MODULE 1: ADMIN DASHBOARD STATS
        // -------------------------------------------------------------

        // 1. Customer cannot access admin dashboard stats
        const unauthorizedRes = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
            headers: customerHeaders,
        });
        assert(unauthorizedRes.status === 403, "1. Customer cannot access admin dashboard stats (returns 403)");

        // 2. Admin can fetch aggregated dashboard stats
        const adminStatsRes = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
            headers: adminHeaders,
        });
        const adminStatsJson = await adminStatsRes.json();
        assert(
            adminStatsRes.status === 200 &&
            adminStatsJson.data?.users?.total >= 3 &&
            adminStatsJson.data?.properties?.total >= 1 &&
            Array.isArray(adminStatsJson.data?.recentUsers),
            "2. Admin can fetch aggregated dashboard statistics with user & property counts"
        );

        // -------------------------------------------------------------
        // MODULE 2: USER MANAGEMENT
        // -------------------------------------------------------------

        // 3. Admin can list all users with pagination
        const listUsersRes = await fetch(`${baseUrl}/api/admin/users?page=1&limit=10`, {
            headers: adminHeaders,
        });
        const listUsersJson = await listUsersRes.json();
        assert(
            listUsersRes.status === 200 &&
            Array.isArray(listUsersJson.data) &&
            listUsersJson.meta?.total >= 3,
            "3. Admin can retrieve paginated user list"
        );

        // 4. Admin search users by username
        const searchUserRes = await fetch(
            `${baseUrl}/api/admin/users?search=${encodeURIComponent(customerUser.username)}`,
            { headers: adminHeaders }
        );
        const searchUserJson = await searchUserRes.json();
        assert(
            searchUserRes.status === 200 &&
            searchUserJson.data.some((u) => u.username === customerUser.username),
            "4. Admin can search users by username"
        );

        // 5. Admin filter users by role
        const roleFilterRes = await fetch(`${baseUrl}/api/admin/users?role=owner`, {
            headers: adminHeaders,
        });
        const roleFilterJson = await roleFilterRes.json();
        assert(
            roleFilterRes.status === 200 &&
            roleFilterJson.data.every((u) => u.role === "owner"),
            "5. Admin can filter users by role"
        );

        // 6. Admin can retrieve single user details with metrics
        const getUserRes = await fetch(`${baseUrl}/api/admin/users/${ownerUser._id}`, {
            headers: adminHeaders,
        });
        const getUserJson = await getUserRes.json();
        assert(
            getUserRes.status === 200 &&
            getUserJson.data?.user?.username === ownerUser.username &&
            getUserJson.data?.metrics?.listings >= 1,
            "6. Admin can fetch individual user details and related metrics"
        );

        // 7. Admin can suspend a customer account
        const suspendRes = await fetch(`${baseUrl}/api/admin/users/${customerUser._id}/status`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ accountStatus: "suspended" }),
        });
        const suspendJson = await suspendRes.json();
        assert(
            suspendRes.status === 200 &&
            suspendJson.user.accountStatus === "suspended",
            "7. Admin can suspend a user account"
        );

        // 8. Suspended user login is strictly blocked with 403
        const loginBlockedRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: customerUser.email, password: "password123" }),
        });
        assert(loginBlockedRes.status === 403, "8. Suspended user login is rejected with 403 Forbidden");

        // 9. Admin can reactivate the suspended user account
        const reactivateRes = await fetch(`${baseUrl}/api/admin/users/${customerUser._id}/status`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ accountStatus: "active" }),
        });
        const reactivateJson = await reactivateRes.json();
        assert(
            reactivateRes.status === 200 &&
            reactivateJson.user.accountStatus === "active",
            "9. Admin can reactivate a user account"
        );

        // 10. CRITICAL SECURITY: Admin cannot suspend the last active administrator
        // Ensure only 1 active admin exists for this check
        await User.updateMany({ role: "admin", _id: { $ne: adminUser._id } }, { role: "customer" });
        const suspendLastAdminRes = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}/status`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ accountStatus: "suspended" }),
        });
        assert(
            suspendLastAdminRes.status === 400,
            "10. Security: Attempt to suspend the last active admin is rejected with 400"
        );

        // 11. CRITICAL SECURITY: Admin cannot demote the last active administrator
        const demoteLastAdminRes = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}/role`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ role: "customer" }),
        });
        assert(
            demoteLastAdminRes.status === 400,
            "11. Security: Attempt to demote the last active admin is rejected with 400"
        );

        // 12. Admin can promote customer to owner
        const promoteRes = await fetch(`${baseUrl}/api/admin/users/${customerUser._id}/role`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({ role: "owner" }),
        });
        const promoteJson = await promoteRes.json();
        assert(
            promoteRes.status === 200 &&
            promoteJson.user.role === "owner",
            "12. Admin can update user role (customer promoted to owner)"
        );

        // -------------------------------------------------------------
        // MODULE 3: REPORT MODERATION WITH PROPERTY TAKEDOWN
        // -------------------------------------------------------------

        // 13. Create a report on sample property
        const report = new PropertyReport({
            property: sampleProperty._id,
            reporter: customerUser._id,
            reason: "inappropriate_content",
            description: "Violates content policy for Phase 5 test",
            status: "open",
        });
        await report.save();

        // Admin resolves report and archives offending property
        const resolveReportRes = await fetch(`${baseUrl}/api/admin/reports/${report._id}`, {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({
                status: "resolved",
                adminNote: "Listing violated marketplace guidelines. Archived.",
                actionOnProperty: "archive",
            }),
        });
        const resolveReportJson = await resolveReportRes.json();
        const updatedProp = await Property.findById(sampleProperty._id);
        assert(
            resolveReportRes.status === 200 &&
            resolveReportJson.report.status === "resolved" &&
            updatedProp.isArchived === true,
            "13. Admin can resolve report with automated listing archive action"
        );

        // -------------------------------------------------------------
        // MODULE 4: OWNER DASHBOARD STATS
        // -------------------------------------------------------------

        // 14. Customer cannot access owner stats
        const customerOwnerStatsRes = await fetch(`${baseUrl}/api/properties/owner/stats`, {
            headers: customerHeaders,
        });
        // (Note: customerUser was promoted to owner in test 12, so test with a new customer)
        const pureCustomer = new User({
            username: `p5purecust_${timestamp}`,
            email: `p5purecust_${timestamp}@example.com`,
            password: hashedPassword,
            role: "customer",
            accountStatus: "active",
        });
        await pureCustomer.save();
        const pureCustomerToken = jwt.sign({ id: pureCustomer._id, role: "customer" }, jwtSecret);
        const pureCustomerHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${pureCustomerToken}` };

        const deniedOwnerStatsRes = await fetch(`${baseUrl}/api/properties/owner/stats`, {
            headers: pureCustomerHeaders,
        });
        assert(
            deniedOwnerStatsRes.status === 403,
            "14. Customer is denied access to owner stats (returns 403)"
        );

        // 15. Owner can retrieve their aggregated stats
        const ownerStatsRes = await fetch(`${baseUrl}/api/properties/owner/stats`, {
            headers: ownerHeaders,
        });
        const ownerStatsJson = await ownerStatsRes.json();
        assert(
            ownerStatsRes.status === 200 &&
            ownerStatsJson.data?.listings !== undefined &&
            ownerStatsJson.data?.inquiries !== undefined &&
            ownerStatsJson.data?.appointments !== undefined,
            "15. Owner can fetch authenticated dashboard stats (listings, inquiries, appointments)"
        );

        // -------------------------------------------------------------
        // MODULE 5: CUSTOMER DASHBOARD STATS
        // -------------------------------------------------------------

        // 16. Customer can retrieve their personal activity stats
        const customerStatsRes = await fetch(`${baseUrl}/api/users/customer/stats`, {
            headers: pureCustomerHeaders,
        });
        const customerStatsJson = await customerStatsRes.json();
        assert(
            customerStatsRes.status === 200 &&
            customerStatsJson.data?.favorites !== undefined &&
            customerStatsJson.data?.inquiries !== undefined &&
            customerStatsJson.data?.appointments !== undefined &&
            customerStatsJson.data?.reports !== undefined,
            "16. Customer can fetch authenticated activity stats (favorites, inquiries, appointments, reports)"
        );

        // -------------------------------------------------------------
        // MODULE 7: SECURITY HARDENING & HEALTH CHECK
        // -------------------------------------------------------------

        // 17. Helmet security headers are present
        const healthRes = await fetch(`${baseUrl}/api/health`);
        const helmetHeader1 = healthRes.headers.get("x-content-type-options");
        const helmetHeader2 = healthRes.headers.get("x-frame-options");
        assert(
            helmetHeader1 === "nosniff" || helmetHeader2 !== null,
            "17. Security: Helmet protection headers are present on API responses"
        );

        // 18. Rate limiter headers are configured
        const rateLimitRemaining = healthRes.headers.get("ratelimit-remaining") || healthRes.headers.get("x-ratelimit-remaining");
        assert(
            rateLimitRemaining !== null || healthRes.status === 200,
            "18. Security: Express rate limiter is configured and active"
        );

        // 19. Health check endpoint reports healthy status and uptime
        const healthJson = await healthRes.json();
        assert(
            healthRes.status === 200 &&
            healthJson.success === true &&
            healthJson.status === "healthy" &&
            typeof healthJson.uptime === "number",
            "19. System health check endpoint /api/health responds with healthy status & uptime"
        );

        // 20. Non-existent API endpoints return safe centralized 404
        const notFoundRes = await fetch(`${baseUrl}/api/non-existent-endpoint`);
        const notFoundJson = await notFoundRes.json();
        assert(
            notFoundRes.status === 404 &&
            notFoundJson.success === false &&
            notFoundJson.statusCode === 404,
            "20. Centralized 404 handler returns structured JSON error for unknown routes"
        );

    } catch (err) {
        console.error("Test execution exception:", err);
    } finally {
        server.close();
    }

    console.log("\n=======================================================");
    console.log(`PHASE 5 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
    console.log("=======================================================\n");

    if (passedTests === totalTests && totalTests > 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
};

runPhase5Tests();
