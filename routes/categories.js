var express = require('express');
var router = express.Router();
let { categories, data } = require('../utils/data')
let slugify = require('slugify')
let { IncrementalId } = require('../utils/IncrementalIdHandler')

/* GET categories listing. */
// Lấy danh sách categories (danh mục)
router.get('/', function (req, res, next) {
    let nameQ = req.query.name ? req.query.name : '';
    // Filter (lọc) danh sách categories dựa trên name
    let result = categories.filter(function (e) {
        return (!e.isDeleted) &&
            e.name.toLowerCase().includes(nameQ.toLowerCase())
    })
    res.send(result);
});

// Lấy category (danh mục) theo slug
router.get('/slug/:slug', function (req, res, next) {
    let slug = req.params.slug;
    // Tìm category (danh mục) cụ thể
    let result = categories.find(
        function (e) {
            return (!e.isDeleted) && e.slug == slug;
        }
    )
    if (result) {
        res.status(200).send(result)
    } else {
        res.status(404).send({
            message: "SLUG NOT FOUND (Không tìm thấy slug)"
        })
    }
});

// Lấy những products (sản phẩm) thuộc category (danh mục) cụ thể
// URL: /api/v1/categories/{id}/products
router.get('/:id/products', function (req, res, next) {
    let categoryId = parseInt(req.params.id);

    // Kiểm tra xem category (danh mục) có tồn tại hay không
    let category = categories.find(c => (!c.isDeleted) && c.id == categoryId);

    if (!category) {
        // Trả về response (phản hồi) lỗi nếu không tìm thấy
        return res.status(404).send({
            message: "CATEGORY NOT FOUND (Không tìm thấy danh mục)"
        });
    }

    // Filter (lọc) products (sản phẩm) có categoryId tương ứng
    let result = data.filter(function (p) {
        return (!p.isDeleted) && p.category && p.category.id == categoryId;
    })
    res.send(result);
});

// Lấy category (danh mục) theo ID
router.get('/:id', function (req, res, next) {
    let result = categories.find(
        function (e) {
            return (!e.isDeleted) && e.id == req.params.id
        }
    );
    if (result) {
        res.status(200).send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND (Không tìm thấy ID)"
        })
    }
});

// Create (thêm mới) một category (danh mục)
router.post('/', function (req, res, next) {
    // Tạo object (đối tượng) mới với thông tin từ request body
    let newObj = {
        id: IncrementalId(categories),
        name: req.body.name,
        slug: slugify(req.body.name, {
            replacement: '-', lower: true, locale: 'vi',
        }),
        image: req.body.image,
        creationAt: new Date(Date.now()),
        updatedAt: new Date(Date.now())
    }
    categories.push(newObj);
    res.send(newObj);
})

// Edit (chỉnh sửa) một category (danh mục)
router.put('/:id', function (req, res, next) {
    // Tìm category để update (cập nhật)
    let result = categories.find(
        function (e) {
            return e.id == req.params.id
        }
    );
    if (result) {
        let body = req.body;
        let keys = Object.keys(body);
        // Duyệt qua các keys để cập nhật values (giá trị)
        for (const key of keys) {
            if (key !== 'id' && key !== 'creationAt') {
                result[key] = body[key];
            }
        }
        // Cập nhật thời gian update
        result.updatedAt = new Date(Date.now());

        // Cập nhật slug nếu name thay đổi
        if (body.name) {
            result.slug = slugify(body.name, {
                replacement: '-', lower: true, locale: 'vi',
            });
        }

        res.send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND (Không tìm thấy ID)"
        })
    }
})

// Delete (xóa) một category (danh mục) - Soft delete (xóa mềm)
router.delete('/:id', function (req, res, next) {
    let result = categories.find(
        function (e) {
            return e.id == req.params.id
        }
    );
    if (result) {
        // Đánh dấu là đã xóa thay vì xóa khỏi mảng
        result.isDeleted = true;
        res.send(result)
    } else {
        res.status(404).send({
            message: "ID NOT FOUND (Không tìm thấy ID)"
        })
    }
})

module.exports = router;
