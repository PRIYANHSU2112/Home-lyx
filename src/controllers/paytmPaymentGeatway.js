exports.payment = (req, res) => {
  const requestObject = {
    amount: "1.00",
    orderId: "0071490615",
    txnToken: "fe795335ed3049c78a57271075f2199e1526969112097",
    mid: "ABCdj00008000000",
  };

  function ready(callback) {
    if (Window.JSBridge) {
      callback && callback();
    } else {
      document.addEventListener("JSBridgeReady", callback, false);
    }
  }

  ready(function () {
    JSBridge.call("paytmPayment", requestObject, function (result) {
      console.log(JSON.stringify(result));
    });
  });
};
