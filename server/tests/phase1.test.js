import http from "http";
import app from "../index.js";
import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const runTests = async () => {
    console.log("\n=======================================================");
    console.log("       REALESTATEHUB PHASE 1 VERIFICATION TESTS       ");
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
        // Test 1: Health Check
        const resHealth = await fetch(`${baseUrl}/api/health`);
        const dataHealth = await resHealth.json();
        assert(resHealth.status === 200 && dataHealth.status === "healthy", "1. Server Health check endpoint works");

        // Test 2: Public registration as Admin must be rejected
        const adminAttempt = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "fakeadmin" + Date.now(),
                email: `fakeadmin${Date.now()}@example.com`,
                password: "password123",
                role: "admin"
            })
        });
        assert(adminAttempt.status === 403, "2. Public registration cannot register as admin (returns 403)");

        // Test 3: Customer Registration works
        const testEmail = `customer_${Date.now()}@example.com`;
        const testUser = `cust_${Date.now()}`;
        const regRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: testUser,
                fullName: "Test Customer",
                email: testEmail,
                password: "password123",
                role: "customer"
            })
        });
        const regData = await regRes.json();
        assert(regRes.status === 201 && regData.success && regData.user.role === "customer", "3. Customer registration works and sets role to customer");
        assert(!regData.user.password, "4. Password hash is never returned in registration response");

        // Test 4: Duplicate Email is rejected
        const dupRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "differentuser" + Date.now(),
                email: testEmail,
                password: "password123",
                role: "customer"
            })
        });
        assert(dupRes.status === 409 || dupRes.status === 400, "5. Duplicate email registration is rejected");

        // Test 5: Login with valid credentials
        const loginRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "password123"
            })
        });
        const loginData = await loginRes.json();
        const cookieHeader = loginRes.headers.get("set-cookie");
        assert(loginRes.status === 200 && loginData.success, "6. Login works with valid credentials");
        assert(cookieHeader && cookieHeader.includes("access_token"), "7. Login sets HttpOnly access_token cookie");
        assert(!loginData.user.password, "8. Password hash is never returned in login response");

        const customerToken = loginData.token;
        const customerCookie = cookieHeader ? cookieHeader.split(";")[0] : `access_token=${customerToken}`;

        // Test 6: Invalid credentials are rejected
        const badLoginRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "wrongpassword"
            })
        });
        assert(badLoginRes.status === 400, "9. Invalid credentials return 400 rejection");

        // Test 7: Current user endpoint /api/auth/me with Cookie
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Cookie: customerCookie }
        });
        const meData = await meRes.json();
        assert(meRes.status === 200 && meData.user.email === testEmail, "10. Current user /api/auth/me works via access_token cookie");

        // Test 8: Current user endpoint with Bearer token
        const meBearerRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        const meBearerData = await meBearerRes.json();
        assert(meBearerRes.status === 200 && meBearerData.user.email === testEmail, "11. Current user /api/auth/me works via Bearer token");

        // Test 9: Profile update works and protects role/accountStatus
        const updateRes = await fetch(`${baseUrl}/api/users/me`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Cookie: customerCookie
            },
            body: JSON.stringify({
                fullName: "Updated Customer Name",
                phone: "123-456-7890",
                role: "admin",
                accountStatus: "suspended"
            })
        });
        const updateData = await updateRes.json();
        assert(updateRes.status === 200 && updateData.user.fullName === "Updated Customer Name", "12. Profile update works for allowed fields");
        assert(updateData.user.role === "customer", "13. User cannot escalate their own role to admin via profile update");
        assert(updateData.user.accountStatus === "active", "14. User cannot manipulate their own account status via profile update");

        // Test 10: Owner Registration works
        const ownerEmail = `owner_${Date.now()}@example.com`;
        const ownerUser = `owner_${Date.now()}`;
        const ownerReg = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: ownerUser,
                fullName: "Real Estate Owner",
                email: ownerEmail,
                password: "password123",
                role: "owner"
            })
        });
        const ownerData = await ownerReg.json();
        const ownerCookie = ownerReg.headers.get("set-cookie")?.split(";")[0];
        assert(ownerReg.status === 201 && ownerData.user.role === "owner", "15. Owner registration works and sets role to owner");

        // Test 11: Authorization - Customer CANNOT access owner endpoint
        const custToOwnerRes = await fetch(`${baseUrl}/api/users/owner-only`, {
            headers: { Cookie: customerCookie }
        });
        assert(custToOwnerRes.status === 403, "16. Customer cannot access owner-only endpoint (returns 403)");

        // Test 12: Authorization - Customer CANNOT access admin endpoint
        const custToAdminRes = await fetch(`${baseUrl}/api/users/admin-only`, {
            headers: { Cookie: customerCookie }
        });
        assert(custToAdminRes.status === 403, "17. Customer cannot access admin-only endpoint (returns 403)");

        // Test 13: Authorization - Owner CAN access owner endpoint
        const ownerToOwnerRes = await fetch(`${baseUrl}/api/users/owner-only`, {
            headers: { Cookie: ownerCookie }
        });
        assert(ownerToOwnerRes.status === 200, "18. Owner can access owner-only endpoint (returns 200)");

        // Test 14: Authorization - Owner CANNOT access admin endpoint
        const ownerToAdminRes = await fetch(`${baseUrl}/api/users/admin-only`, {
            headers: { Cookie: ownerCookie }
        });
        assert(ownerToAdminRes.status === 403, "19. Owner cannot access admin-only endpoint (returns 403)");

        // Test 15: Suspended user restriction
        const suspendedUser = new User({
            username: `suspended_${Date.now()}`,
            email: `suspended_${Date.now()}@example.com`,
            password: await bcrypt.hash("password123", 10),
            role: "customer",
            accountStatus: "suspended"
        });
        await suspendedUser.save();

        const suspendedLogin = await fetch(`${baseUrl}/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: suspendedUser.email,
                password: "password123"
            })
        });
        assert(suspendedLogin.status === 403, "20. Suspended user login is blocked with 403 Forbidden");

        // Test 16: Public user profile returns safe fields only
        const publicProfileRes = await fetch(`${baseUrl}/api/users/${ownerData.user._id}`);
        const publicProfileData = await publicProfileRes.json();
        assert(
            publicProfileRes.status === 200 &&
            publicProfileData.user._id &&
            !publicProfileData.user.password &&
            !publicProfileData.user.email,
            "21. Public profile returns safe fields without exposing password or email"
        );

        // Test 17: Logout works
        const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
            method: "POST",
            headers: { Cookie: customerCookie }
        });
        assert(logoutRes.status === 200, "22. Logout endpoint works and returns 200");

        console.log(`\n=======================================================`);
        console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
        console.log(`=======================================================\n`);

        server.close();
        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (err) {
        console.error("Test execution failed with error:", err);
        server.close();
        process.exit(1);
    }
};

runTests();
