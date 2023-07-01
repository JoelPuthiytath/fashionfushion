function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart?id=" + proId,
    method: "put",
    success: (response) => {
      if (response.status) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
        Toast.fire({
          icon: "success",
          title: "added to cart successfully",
        });
      }
    },
  });
}

function addToWishList(proId) {
  $.ajax({
    url: "/add-to-wishList?id=" + proId,
    method: "post",
    success: (response) => {
      if (response.status) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        Toast.fire({
          icon: "success",
          title: "added to Wishlist",
        });
      }
    },
  });
}

function changeQty(cartId, productId, userId, price, count) {
  let quantity = parseInt(document.getElementById(productId).innerHTML);
  console.log(quantity + count);
  $.ajax({
    url: "/change-product-quantity",
    data: {
      cart: cartId,
      product: productId,
      user: userId,
      quantity: quantity,
      price: price,
      count: count,
    },
    method: "post",
    success: (response) => {
      document.getElementById("cartSubtotal").innerHTML = "₹" + response.total;
      console.log(response);
      if (response.outOfStock == false) {
        document.getElementById(productId).innerText = quantity + count;
        document.getElementById("cartTotal").innerHTML = "₹" + response.total;
        location.reload();
      } else if (response.minus) {
        alert("product removed from the cart");
        location.reload();
        document.getElementById("qty-down").classList.add("disabled");
      } else {
        console.log("working");
        document.getElementById("qty-up").classList.add("disabled");
      }
    },
  });
}
// if (response.response.ourOfStock) {
//   console.log("incrimenting or decrementing");
//   document.getElementById(proId).innerHTML = quantity + count;
//   document.getElementById("totalPrice").innerHTML = "₹" + response.total.total;
//   document.getElementById("adTax").innerHTML = "₹" + response.total.totalTax;
//   document.getElementById("taxWithTotal").innerHTML =
//     "₹" + response.total.totalWithTax;
// } else if (response.response.minus) {
//   console.log("inside minus value");
//   document.getElementById(proId).classList.add("disabled");
// } else {
//   document.getElementById("plusButton").classList.add("disabled");
// }
function productRemove(proId, cartId) {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to delete this item from the cart ?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/cart-product-remove",
        method: "post",
        data: {
          productId: proId,
          cartId: cartId,
        },
        success: (response) => {
          Swal.fire("Deleted!", "Your file has been deleted.", "success").then(
            () => {
              if (response.status) {
                location.reload();
              }
            }
          );
        },
      });
    }
  });
}

function removeFromWishlist(wishListId, productId) {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to remove this item from Wishlist ?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, remove it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/wishlist-item-remove",
        method: "post",
        data: {
          productId: productId,
          wishListId: wishListId,
        },
        success: (response) => {
          Swal.fire("Removed!", "This item has been removed.", "success").then(
            () => {
              if (response.status) {
                location.reload();
              }
            }
          );
        },
      });
    }
  });
}
function addressRemove(userId, addressId) {
  $.ajax({
    url: "/shipping-address-delete",
    method: "put",
    data: {
      userId,
      addressId,
    },
    success: (response) => {
      if (response.status) {
        location.reload();
      }
    },
  });
}

$(document).ready(function () {
                
  $('#checkout-form').submit(function (event) {
      event.preventDefault();
  let address=document.getElementById('selectedAddress').value
  console.log(address,"this is checking")

      if (address === "") {
          Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'select an address before Place order',
          })
      return
      }
      let couponCodeArray = $("#selectedCoupon").val()
      //let couponConde = couponCodeArray[1]
      let formData = $(this).serializeArray();
      formData.push({ name: "coupon", value: couponCodeArray })
      console.log(formData)

      $.ajax({
          type: 'POST',
          url: '/place-order',
          data: formData,
          success: function (response) {
              console.log(response)
              if (response.COD) {
                  console.log(response.orderId)
                  location.href = `/order-success-page?id=${response.orderId}`;
              } else if (response.wallet === false) {
                  Swal.fire({
                      icon: 'error',
                      title: 'Oops...',
                      text: response.message,
                  })
              } else if (response.wallet === true) {
                  Swal.fire({
                      position: 'top-end',
                      icon: 'success',
                      title: 'Your order placed Sucessfuly',
                      showConfirmButton: false,
                      timer: 1500
                  }).then(() => {
                      location.href = `/order-success-page?id=${response.orderId}`;
                  })
              }
              else {
                  console.log(response,"this is the response")
                  razorpayPayment(response)
              }
          },
          error: function (xhr, status, error) {
          }
      });
  });
});