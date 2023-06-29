
const productHelper = require("./productHelper");
const productsSchema = require("../models/productSchema");
const cartSchema = require("../models/cartSchema");


module.exports = {
  //  search product ##############

  searchProduct: async (req, res) => {
      const searchItem = req.query.item;
      console.log(searchItem);
      try {
        const findProducts = await productsSchema.find({
          $text: { $search: searchItem },
          deleted: false,
        });

        const products = await productHelper.getAllProduct();
        const category = await productHelper.getAllCategory();
        if (findProducts.length === 0) {
          req.session.message = {
            type: "error",
            message: "product not found",
          };
          res.redirect("/admin/page-products");
          return;
        }
        res.render("../views/admin/page-products-grid.hbs", {
          admin: true,
          products: findProducts,
          findProducts: true,
          category,
        });
      } catch (err) {
        console.log(` ${err}`);
      }
  },

  // sort product ############

  sortProducts: async (req, res) => {
    if (req.session.admin) {
      const sortBy = req.query.sortBy;

      try {
        let sortQuery = {};

        if (sortBy === "product_name" || sortBy === "product_price") {
          sortQuery[sortBy] = 1;
        } else {
          // Handle invalid sortBy value, set default sorting
          sortQuery = { product_name: 1 };
        }

        const products = await productsSchema
          .find({ deleted: false })
          .sort(sortQuery);

        res.render("../views/admin/page-products-grid.hbs", {
          admin: true,
          products,
        });
      } catch (error) {
        res.render("error", { error: "An error occurred" });
      }
    } else {
      res.redirect("/admin/login");
    }
  },
  // pagination ###############
  paginateProducts: async (req, res) => {
    if (req.session.admin) {
      const page = parseInt(req.query.page) || 1;
      console.log(`page is : ${page}`);
      const limit = 8; // Number of products per page
      try {
        const count =
          await productsSchema.countDocuments();
        console.log(`this is the count ${count}`);

        const totalPages = Math.ceil(count / limit);
        console.log(`this is totalpages: ${totalPages}`);
        const categories = await productHelper.getAllCategory();
        const products = await productsSchema
          .find({ deleted: false })
          .skip((page - 1) * limit)
          .limit(limit);

        // console.log(`this is products : ${products}`);

        res.render("../views/admin/page-products-grid.hbs", {
          admin: true,
          products,
          categories,
          totalPages,
          currentPage: page,
        });
      } catch (error) {
        res.render("error", { error: "An error occurred" });
      }
    } else {
      res.redirect("/admin/login");
    }
  },
};
