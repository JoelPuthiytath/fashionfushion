
function razorpayPayment(order) {
  console.log("inside razorpayPayment")
console.log("fxzr0SPMlzgtZKIA2CqBvO5d" ,"razorpayPayment function ==== >")

  var options = {
    key: "rzp_test_DYIyg5jaTx4LZz",
    amount: order.amount,
    currency: "INR",
    name: "FashionFlair",
    description: "Test Transaction",
    image:
      "https://cdn.dribbble.com/users/5976/screenshots/281053/media/ee2634ef748f4f5a2dc9d5e1c4c64aea.jpg?compress=1&resize=400x300&vertical=center",
    order_id: order.id,
    handler: function (response) {
      verifyPayment(response, order);
    },
    prefill: {
      //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
      name: "joel", //your customer's name
      email: "joel.joel@example.com",
      contact: "9000090000", //Provide the customer's phone number for better conversion rates
    },
    notes: {
      address: "FashionFlair Office",
    },
    theme: {
      color: "#3399cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}
function verifyPayment(payment, order) {
  $.ajax({
    url: "/verify-payment",
    method: "post",
    data: {
      payment,
      order,
    },
    success: (response) => {
      console.log(response);
      if (response.status) {
        location.href = `/order-success-page?id=${response.orderId}`;
      } else {
        Swal.fire({
          position: "center",
          icon: "error",
          title: response.errMsg,
          showConfirmButton: false,
          timer: 2000,
        });
      }
    },
  });
}