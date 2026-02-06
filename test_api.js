const http = require('http');

// Hàm hỗ trợ gửi request
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    if (!data) {
                        resolve({ statusCode: res.statusCode, body: null });
                    } else {
                        resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                    }
                } catch (e) {
                    console.error(`Lỗi parse JSON cho ${method} ${path}:`, data);
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- BẮT ĐẦU TEST API CATEGORIES ---');
    let categoryId = null;

    try {
        // 1. GET Tất cả danh mục
        console.log('\n1. Test GET /api/v1/categories');
        const getAllRes = await makeRequest('GET', '/api/v1/categories');
        console.log('Status:', getAllRes.statusCode);
        console.log('Số lượng:', getAllRes.body.length);
        if (getAllRes.statusCode === 200 && Array.isArray(getAllRes.body)) {
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }

        // 2. GET Lọc theo tên
        console.log('\n2. Test GET /api/v1/categories?name=Shoes');
        const getFilterRes = await makeRequest('GET', '/api/v1/categories?name=Shoes');
        console.log('Status:', getFilterRes.statusCode);
        if (getFilterRes.statusCode === 200 && Array.isArray(getFilterRes.body) && getFilterRes.body.length > 0) {
            console.log('Tìm thấy:', getFilterRes.body[0].name);
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }

        // 3. Tạo Category mới
        console.log('\n3. Test POST /api/v1/categories');
        const newCat = {
            name: "Danh Mục Test",
            image: "https://example.com/image.png"
        };
        const createRes = await makeRequest('POST', '/api/v1/categories', newCat);
        console.log('Status:', createRes.statusCode);
        if (createRes.statusCode === 200 && createRes.body.name === newCat.name) {
            console.log('ID vừa tạo:', createRes.body.id);
            categoryId = createRes.body.id;
            console.log('✅ PASS');
        } else {
            console.log('❌ FAIL');
        }

        // 4. GET Theo ID
        if (categoryId) {
            console.log(`\n4. Test GET /api/v1/categories/${categoryId}`);
            const getByIdRes = await makeRequest('GET', `/api/v1/categories/${categoryId}`);
            console.log('Status:', getByIdRes.statusCode);
            if (getByIdRes.statusCode === 200 && getByIdRes.body.id === categoryId) {
                console.log('✅ PASS');
            } else {
                console.log('❌ FAIL');
            }
        }

        // 5. GET Products theo Category
        console.log('\n5. Test GET /api/v1/categories/7/products (Category ID 7)');
        const getProdsRes = await makeRequest('GET', '/api/v1/categories/7/products');
        console.log('Status:', getProdsRes.statusCode);
        if (getProdsRes.statusCode === 200 && Array.isArray(getProdsRes.body)) {
            console.log('Số sản phẩm tìm thấy:', getProdsRes.body.length);
            const allCorrectCategory = getProdsRes.body.every(p => p.category.id == 7);
            if (allCorrectCategory) {
                console.log('Tất cả sản phẩm đều thuộc category 7');
                console.log('✅ PASS');
            } else {
                console.log('❌ FAIL: Có sản phẩm không đúng category');
            }
        } else {
            console.log('❌ FAIL');
        }

        // 6. GET Theo Slug
        if (categoryId) {
            const getByIdRes = await makeRequest('GET', `/api/v1/categories/${categoryId}`);
            const slug = getByIdRes.body.slug;
            console.log(`\n6. Test GET /api/v1/categories/slug/${slug}`);

            const getBySlugRes = await makeRequest('GET', `/api/v1/categories/slug/${slug}`);
            console.log('Status:', getBySlugRes.statusCode);
            if (getBySlugRes.statusCode === 200 && getBySlugRes.body.id === categoryId) {
                console.log('✅ PASS');
            } else {
                console.log('❌ FAIL');
            }
        }

        // 7. Edit Category
        if (categoryId) {
            console.log(`\n7. Test PUT /api/v1/categories/${categoryId}`);
            const updateData = { name: "Danh Mục Test Update" };
            const updateRes = await makeRequest('PUT', `/api/v1/categories/${categoryId}`, updateData);
            console.log('Status:', updateRes.statusCode);
            if (updateRes.statusCode === 200 && updateRes.body.name === "Danh Mục Test Update") {
                console.log('✅ PASS: Cập nhật tên thành công');
                if (updateRes.body.slug === 'danh-muc-test-update') {
                    console.log('✅ PASS: Slug tự động cập nhật');
                } else {
                    console.log('❌ FAIL: Slug chưa cập nhật. Slug hiện tại:', updateRes.body.slug);
                }
            } else {
                console.log('❌ FAIL');
            }
        }

        // 8. Delete Category
        if (categoryId) {
            console.log(`\n8. Test DELETE /api/v1/categories/${categoryId}`);
            const deleteRes = await makeRequest('DELETE', `/api/v1/categories/${categoryId}`);
            console.log('Status:', deleteRes.statusCode);
            if (deleteRes.statusCode === 200 && deleteRes.body.isDeleted === true) {
                console.log('✅ PASS: Xóa thành công');
            } else {
                console.log('❌ FAIL');
            }

            // Verify it is not returned in getAll
            console.log(`\n9. Verify Soft Delete (Kiểm tra xem đã xóa chưa)`);
            const verifyDelRes = await makeRequest('GET', `/api/v1/categories/${categoryId}`);
            if (verifyDelRes.statusCode === 404) {
                console.log('✅ PASS: Không tìm thấy ID sau khi xóa');
            } else {
                console.log('❌ FAIL: Vẫn tìm thấy ID. Status:', verifyDelRes.statusCode);
            }
        }

    } catch (error) {
        console.error('Test gặp lỗi:', error);
    } finally {
        console.log('\n--- KẾT THÚC TEST ---');
    }
}

runTests();
