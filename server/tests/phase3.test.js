import http from "http";
import app from "../index.js";
import User from "../models/User.model.js";
import Property from "../models/Property.model.js";
import Favorite from "../models/Favorite.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const runPhase3Tests = async () => {
    console.log("\n=======================================================");
    console.log("       REALESTATEHUB PHASE 3 VERIFICATION TESTS       ");
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

        // 1. Setup users: Owner, Customer
        const owner = new User({
            username: `p3owner_${timestamp}`,
            email: `p3owner_${timestamp}@example.com`,
            password: hashedPassword,
            role: "owner",
            accountStatus: "active",
        });
        await owner.save();

        const customer = new User({
            username: `p3customer_${timestamp}`,
            email: `p3customer_${timestamp}@example.com`,
            password: hashedPassword,
            role: "customer",
            accountStatus: "active",
        });
        await customer.save();

        const customerToken = jwt.sign(
            { id: customer._id, role: "customer" },
            process.env.JWT_SECRET || "fallback_secret_realestatehub"
        );
        const customerHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
        };

        // 2. Seed diverse properties:
        // Prop 1: Approved, Available, Sale, Villa in Miami, $900,000, 4 beds
        const prop1 = new Property({
            title: `Seaside Modern Villa ${timestamp}`,
            description: "Luxurious seaside villa with infinity pool and private dock.",
            propertyType: "villa",
            listingType: "sale",
            price: 900000,
            currency: "USD",
            location: { city: "Miami", area: "South Beach", address: "10 Ocean Dr" },
            specifications: { bedrooms: 4, bathrooms: 3, areaSqm: 350, parking: true, furnished: "furnished" },
            images: [{ publicId: "img_v1", secureUrl: "http://example.com/v1.jpg", isCover: true }],
            owner: owner._id,
            approvalStatus: "approved",
            availabilityStatus: "available",
        });
        await prop1.save();

        // Prop 2: Approved, Available, Rent, Apartment in Miami, $3,500/mo, 2 beds
        const prop2 = new Property({
            title: `Downtown Miami Highrise ${timestamp}`,
            description: "Modern downtown condo near financial district with balcony.",
            propertyType: "apartment",
            listingType: "rent",
            price: 3500,
            currency: "USD",
            location: { city: "Miami", area: "Brickell", address: "500 Brickell Ave" },
            specifications: { bedrooms: 2, bathrooms: 2, areaSqm: 110, parking: true, furnished: "semi_furnished" },
            images: [{ publicId: "img_a1", secureUrl: "http://example.com/a1.jpg", isCover: true }],
            owner: owner._id,
            approvalStatus: "approved",
            availabilityStatus: "available",
        });
        await prop2.save();

        // Prop 3: Approved, Available, Sale, House in Orlando, $450,000, 3 beds
        const prop3 = new Property({
            title: `Suburban Orlando Family Home ${timestamp}`,
            description: "Peaceful family home with large backyard and garage.",
            propertyType: "house",
            listingType: "sale",
            price: 450000,
            currency: "USD",
            location: { city: "Orlando", area: "Lake Nona", address: "789 Lake Rd" },
            specifications: { bedrooms: 3, bathrooms: 2, areaSqm: 220, parking: true, furnished: "unfurnished" },
            images: [{ publicId: "img_h1", secureUrl: "http://example.com/h1.jpg", isCover: true }],
            owner: owner._id,
            approvalStatus: "approved",
            availabilityStatus: "available",
        });
        await prop3.save();

        // Prop 4: PENDING (must NOT show in public search)
        const propPending = new Property({
            title: `Hidden Unapproved House ${timestamp}`,
            description: "Pending moderation.",
            propertyType: "house",
            listingType: "sale",
            price: 300000,
            currency: "USD",
            location: { city: "Miami", area: "Wynwood" },
            specifications: { bedrooms: 2, bathrooms: 1, areaSqm: 90 },
            images: [{ publicId: "img_pend", secureUrl: "http://example.com/pend.jpg", isCover: true }],
            owner: owner._id,
            approvalStatus: "pending",
            availabilityStatus: "available",
        });
        await propPending.save();

        // Prop 5: SOLD (must NOT show in public available search)
        const propSold = new Property({
            title: `Sold Apartment ${timestamp}`,
            description: "Already sold.",
            propertyType: "apartment",
            listingType: "sale",
            price: 500000,
            currency: "USD",
            location: { city: "Miami", area: "Midtown" },
            specifications: { bedrooms: 2, bathrooms: 2, areaSqm: 100 },
            images: [{ publicId: "img_sold", secureUrl: "http://example.com/sold.jpg", isCover: true }],
            owner: owner._id,
            approvalStatus: "approved",
            availabilityStatus: "sold",
        });
        await propSold.save();

        // Test 1: Public property search returns approved and available properties
        const allRes = await fetch(`${baseUrl}/api/properties?city=Miami`);
        const allData = await allRes.json();
        assert(allRes.status === 200 && allData.success, "1. Public property search endpoint responds with 200 OK");
        assert(allData.data.some((p) => p._id === prop1._id.toString()), "2. Approved property 1 is present in public results");
        assert(allData.data.some((p) => p._id === prop2._id.toString()), "3. Approved property 2 is present in public results");
        assert(!allData.data.some((p) => p._id === propPending._id.toString()), "4. Pending property is excluded from public results");
        assert(!allData.data.some((p) => p._id === propSold._id.toString()), "5. Sold property is excluded from public available search");

        // Test 2: Search by keyword
        const kwRes = await fetch(`${baseUrl}/api/properties?search=Highrise`);
        const kwData = await kwRes.json();
        assert(kwData.data.length > 0 && kwData.data.some((p) => p._id === prop2._id.toString()), "6. Keyword search matches title/description correctly");

        // Test 3: Filter by listingType
        const rentRes = await fetch(`${baseUrl}/api/properties?listingType=rent`);
        const rentData = await rentRes.json();
        assert(rentData.data.every((p) => p.listingType === "rent"), "7. listingType=rent filter returns only rental listings");

        // Test 4: Filter by propertyType
        const villaRes = await fetch(`${baseUrl}/api/properties?propertyType=villa`);
        const villaData = await villaRes.json();
        assert(villaData.data.every((p) => p.propertyType === "villa"), "8. propertyType=villa filter returns only villas");

        // Test 5: Filter by price range
        const priceRes = await fetch(`${baseUrl}/api/properties?minPrice=500000&maxPrice=1000000`);
        const priceData = await priceRes.json();
        assert(priceData.data.every((p) => p.price >= 500000 && p.price <= 1000000), "9. Price range filters (minPrice/maxPrice) filter correctly");

        // Test 6: Filter by bedrooms
        const bedRes = await fetch(`${baseUrl}/api/properties?bedrooms=4`);
        const bedData = await bedRes.json();
        assert(bedData.data.every((p) => p.specifications.bedrooms >= 4), "10. Minimum bedrooms filter works correctly");

        // Test 7: Sorting by price ascending
        const sortRes = await fetch(`${baseUrl}/api/properties?city=Miami&sort=price_asc`);
        const sortData = await sortRes.json();
        const prices = sortData.data.map((p) => p.price);
        const isSortedAsc = prices.every((val, i, arr) => !i || arr[i - 1] <= val);
        assert(isSortedAsc, "11. Sorting by price_asc sorts listings low-to-high");

        // Test 8: Pagination metadata
        const pageRes = await fetch(`${baseUrl}/api/properties?limit=2&page=1`);
        const pageData = await pageRes.json();
        assert(pageData.meta.limit === 2 && pageData.meta.page === 1 && pageData.meta.totalPages >= 1, "12. Pagination metadata (limit, page, totalPages) is accurate");

        // Test 9: Related properties endpoint
        const relRes = await fetch(`${baseUrl}/api/properties/${prop1._id}/related`);
        const relData = await relRes.json();
        assert(relRes.status === 200 && relData.success, "13. Related properties endpoint works");
        assert(!relData.data.some((p) => p._id === prop1._id.toString()), "14. Related properties excludes the current property itself");

        // Test 10: Unauthenticated user cannot add favorite
        const unauthFavRes = await fetch(`${baseUrl}/api/favorites/${prop1._id}`, { method: "POST" });
        assert(unauthFavRes.status === 401, "15. Unauthenticated user cannot add a favorite (returns 401)");

        // Test 11: Authenticated customer adds favorite
        const addFavRes = await fetch(`${baseUrl}/api/favorites/${prop1._id}`, {
            method: "POST",
            headers: customerHeaders,
        });
        const addFavData = await addFavRes.json();
        assert(addFavRes.status === 201 && addFavData.isFavorited === true, "16. Customer can successfully favorite an approved property");

        // Test 12: Cannot favorite unapproved property
        const badFavRes = await fetch(`${baseUrl}/api/favorites/${propPending._id}`, {
            method: "POST",
            headers: customerHeaders,
        });
        assert(badFavRes.status === 400, "17. Cannot favorite an unapproved property listing (returns 400)");

        // Test 13: Duplicate favorite is handled gracefully
        const dupFavRes = await fetch(`${baseUrl}/api/favorites/${prop1._id}`, {
            method: "POST",
            headers: customerHeaders,
        });
        const dupFavData = await dupFavRes.json();
        assert(dupFavRes.status === 200 && dupFavData.isFavorited === true, "18. Duplicate favorite is handled gracefully and returns isFavorited: true");

        const favCount = await Favorite.countDocuments({ user: customer._id, property: prop1._id });
        assert(favCount === 1, "19. Database strictly preserves exactly 1 record for unique user-property favorite pair");

        // Test 14: Check favorite endpoint
        const checkFavRes = await fetch(`${baseUrl}/api/favorites/check/${prop1._id}`, {
            headers: customerHeaders,
        });
        const checkFavData = await checkFavRes.json();
        assert(checkFavData.isFavorited === true, "20. GET /api/favorites/check/:id accurately returns isFavorited: true");

        // Test 15: Get favorite IDs list
        const idsRes = await fetch(`${baseUrl}/api/favorites/ids`, {
            headers: customerHeaders,
        });
        const idsData = await idsRes.json();
        assert(idsData.favoriteIds.includes(prop1._id.toString()), "21. GET /api/favorites/ids contains the favorited property ID");

        // Test 16: Get full favorites list with populated property
        const getFavsRes = await fetch(`${baseUrl}/api/favorites`, {
            headers: customerHeaders,
        });
        const getFavsData = await getFavsRes.json();
        assert(getFavsRes.status === 200 && getFavsData.data.length > 0, "22. Customer can fetch their full favorites list");
        assert(getFavsData.data[0].property.title.includes("Seaside"), "23. Populated property in favorites includes correct title and metadata");

        // Test 17: Remove favorite
        const remFavRes = await fetch(`${baseUrl}/api/favorites/${prop1._id}`, {
            method: "DELETE",
            headers: customerHeaders,
        });
        const remFavData = await remFavRes.json();
        assert(remFavRes.status === 200 && remFavData.isFavorited === false, "24. Customer can remove a property from favorites");

        const checkAfterRemove = await Favorite.findOne({ user: customer._id, property: prop1._id });
        assert(checkAfterRemove === null, "25. Favorite record is cleanly removed from database");

        console.log(`\n=======================================================`);
        console.log(`PHASE 3 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
        console.log(`=======================================================\n`);

        server.close();
        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (err) {
        console.error("Phase 3 test execution failed:", err);
        server.close();
        process.exit(1);
    }
};

runPhase3Tests();
