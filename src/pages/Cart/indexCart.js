import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import style from "./Cart.scss";
import axios from "axios";
import leftArrow from "../../assets/image/left-arrow.png";
import xIcon from "../../assets/image/x_icon_150997.png";
import payByMoneyIcon from "../../assets/image/moneyicon.png";
import payByBankIcon from "../../assets/image/bankicon.png";
import tickIcon from "../../assets/image/tick icon.png";
import cloneBankQR from "../../assets/image/clone QR.png";
import copyIcon from "../../assets/image/copyICON.png";
import plusIcon from "../../assets/image/plus_icon-icons.com_66718.png";
import minusIcon from "../../assets/image/free-minus-icon-3108-thumb.png";
import Loading from "../../components/loadingScreen/loading";
import IconBill from "../../components/IconBill";
const cx = classNames.bind(style);

function Cart() {
  const navigate = useNavigate();
  const [copyText, setCopyText] = useState("");
  const [choosePaymentMethod, setChoosePaymentMethod] = useState("");
  const [pickedPaymentMethod, setPickedPaymentMethod] = useState("");
  const [cartStored, setCartStored] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isFail, setIsFail] = useState(false);
  const [isUnable, setIsUnable] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [allActive, setAllActive] = useState([]);
  const [foodFailName, setFoodFailName] = useState("");
  const [showBankInforName, setShowBankInforName] = useState("");
  const [amoutRemain, setAmountRemain] = useState(0);
  const [paymentImage, setPaymentImage] = useState({
    image: "",
  });
  const [pushData, setPushData] = useState({
    note: "",
    total: "",
    table: "",
    image_payment_id: "",
    customer_name: "",
    order: [
      {
        dish_id: "",
        number: "",
        options: [],
      },
    ],
  });

  let storedSession = JSON.parse(sessionStorage.getItem("obj")) || [];
  let customer_name_session = JSON.parse(sessionStorage.getItem("name")) || [];
  const group_id = sessionStorage.getItem("group_id") || 0;

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/dish/menu/activedByCashier/${group_id}`)
      .then((response) => {
        setAllActive(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const tableStored = sessionStorage.getItem("table") || 0;
  // const tableStored = 5;
  useEffect(() => {
    setCartStored(storedSession);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("obj", JSON.stringify(cartStored));
    if (cartStored.length === 0) {
      setIsUnable(true);
    } else {
      setIsUnable(false);
    }
  }, [cartStored]);

  const getTotalBill = () => {
    return cartStored.reduce(
      (total, food) => total + food.price * food.number,
      0
    );
  };
  const getOrderData = () => {
    return cartStored.map((food) => ({
      dish_id: food.id,
      number: food.number,
      options: food.options,
    }));
  };
  // Function to increase the quantity of an item
  const increaseQuantity = (index) => {
    const updatedCart = [...cartStored];
    const food = updatedCart[index];
    const { id } = food;
    const totalQuantity = cartStored.reduce((total, item) => {
      if (item.id === id) {
        return total + item.number;
      }
      return total;
    }, 0);
    const activeItem = allActive.find((item) => item._id === id);
    if (!activeItem || activeItem.amount < totalQuantity + 1) {
      setIsFail(true);
      setFoodFailName(food.name);
      setAmountRemain(activeItem.amount);
      return;
    }

    food.number += 1;
    setCartStored(updatedCart);
  };

  // Function to decrease the quantity of an item
  const decreaseQuantity = (index) => {
    const updatedCart = [...cartStored];
    if (updatedCart[index].number > 1) {
      updatedCart[index].number -= 1;
      setCartStored(updatedCart);
    }
  };
  const removeItem = (index) => {
    const updatedCart = [...cartStored];
    updatedCart.splice(index, 1);
    setCartStored(updatedCart);
  };

  useEffect(() => {
    setPushData((prevState) => ({
      ...prevState,
      total: getTotalBill(),
      order: getOrderData(),
      table: tableStored,
      customer_name: customer_name_session,
    }));
  }, [cartStored, tableStored, customer_name_session]);

  useEffect(() => {
    setIsSuccess(false);
  }, [pushData]);

  if (!cartStored || allActive.length === 0) {
    return (
      <div>
        <div className={cx("topCart")}>
          <button
            className={cx("backButton")}
            onClick={() => navigate("/showall")}
          >
            <img src={leftArrow} alt="icon" />
          </button>
          <p className={cx("topTitle")}>Món Bạn Đã Chọn</p>
        </div>
        <div className={cx("loadNote")}>
          <Loading></Loading>
        </div>
      </div>
    );
  }
  const confirmHandler = () => {
    setIsConfirm(true);
  };
  const cancelHandler = () => {
    setIsConfirm(false);
  };
  const cancelHandler2 = () => {
    setIsFail(false);
  };

  const cancelHandler3 = () => {
    setIsUnable(false);
  };

  const cancelHandler4 = () => {
    setChoosePaymentMethod("")
  };

  const finishHandler = () => {
    navigate("/showall");
    sessionStorage.removeItem("obj");
  };

  const handleNeedChoosePaymentMethod = () => {
    console.log("Chọn Cách Thanh Toán");
    // setIsWaiting(true);
    if (cartStored.length === 0) {
      setIsUnable(true);
    } else {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/dish/menu/activedByCashier/${group_id}`
        )
        .then((response) => {
          const availableDishes = response.data;
          const unavailableItems = [];
          for (const cartItem of cartStored) {
            const totalQuantity = cartStored.reduce((total, item) => {
              if (item.id === cartItem.id) {
                return total + item.number;
              }
              return total;
            }, 0);
            const activeItem = availableDishes.find(
              (item) => item._id === cartItem.id
            );

            if (!activeItem || activeItem.amount < totalQuantity) {
              unavailableItems.push(cartItem);
            }
          }

          if (unavailableItems.length > 0) {
            const firstUnavailableItem = unavailableItems[0];
            const foodFailName = firstUnavailableItem.name;
            const amountRemain =
              availableDishes.find(
                (item) => item._id === firstUnavailableItem.id
              )?.amount || 0;

            setFoodFailName(foodFailName);
            setAmountRemain(amountRemain);
            setIsFail(true);
            // setIsWaiting(false);
          } else {
            setChoosePaymentMethod("Pick")
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  const sendBill = (payMethod) => {
    // setIsWaiting(true);
    if (cartStored.length === 0) {
      setIsUnable(true);
    } else {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/dish/menu/activedByCashier/${group_id}`
        )
        .then((response) => {
          const availableDishes = response.data;
          const unavailableItems = [];
          for (const cartItem of cartStored) {
            const totalQuantity = cartStored.reduce((total, item) => {
              if (item.id === cartItem.id) {
                return total + item.number;
              }
              return total;
            }, 0);
            const activeItem = availableDishes.find(
              (item) => item._id === cartItem.id
            );

            if (!activeItem || activeItem.amount < totalQuantity) {
              unavailableItems.push(cartItem);
            }
          }

          if (unavailableItems.length > 0) {
            const firstUnavailableItem = unavailableItems[0];
            const foodFailName = firstUnavailableItem.name;
            const amountRemain =
              availableDishes.find(
                (item) => item._id === firstUnavailableItem.id
              )?.amount || 0;

            setFoodFailName(foodFailName);
            setAmountRemain(amountRemain);
            setIsFail(true);
            setIsWaiting(false);
          } else {
            if (payMethod === "MONEY") {
              console.log("tiền mặt");
              //   axios
              //     .post(
              //       `${process.env.REACT_APP_API_URL}/cart/create/${group_id}`,
              //       pushData
              //     )
              //     .then((response) => {
              //       // setIsSuccess(true);
              //       console.log(response.data._id);
              //       setIsWaiting(false);
              //     })
              //     .catch((error) => {
              //       console.log(error);
              //     });
              // }
              if (payMethod === "BANK") {
                console.log("Chuyển Khoản");
                console.log(paymentImage);
                // axios
                //   .post(
                //     `${process.env.REACT_APP_API_URL}/cart/create/${group_id}`,
                //     pushData
                //   )
                //   .then((response) => {
                //     // setIsSuccess(true);
                //     console.log(response.data._id);
                //     setIsWaiting(false);
                //   })
                //   .catch((error) => {
                //     console.log(error);
                //   });
                // axios
                //   .put(`${process.env.REACT_APP_API_URL}/cart/payByCustomer/${cart_id}`)
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  const handleBackButton = () => {
    if (choosePaymentMethod === "") {
      navigate("/showall")
    }
    if (choosePaymentMethod !== "") {
      setChoosePaymentMethod("")
      setPickedPaymentMethod("")
      setShowBankInforName("")
      setShowGuide(false)
    }
  }

  const handlePickedBank = (value) => {
    setShowBankInforName(value)
  }

  const handlePickedPaymentMethod = (value) => {
    setPickedPaymentMethod(value)
    if (value !== "BANK") {
      setShowBankInforName("")
    }
    if (value === "BANK" && pickedPaymentMethod !== "BANK") {
      setShowGuide(true)
    }
  }

  const handleCopyClick = (value) => {
    if (document.queryCommandSupported('copy')) {
      console.log("coppied");
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyText(value)
    } else {
      console.log("cant copy");
    }
  };

  const handleUnderStood = () => {
    setShowGuide(false)
  }

  function handleFileInputChange(event) {
    const fileInput = event.target;
    const fileLabel = document.getElementById("file-label");
    const file = event.target.files[0];
    if (fileInput.files && fileInput.files.length > 0) {
      // setState({ ...state, [event.target.name]: file });
      setPushData({ ...pushData, image_payment_id: file })
      fileLabel.innerText = fileInput.files[0].name;
    } else {
      fileLabel.innerText = "Ấn Để Chọn Ảnh";
    }

    if (event.target.files.length > 0) {
      // File has been selected, add the active class
      setIsActive(true);
    } else {
      // No file selected, remove the active class
      setIsActive(false);
    }
  }

  return (
    <div>
      <div className={cx("cartSpecial")}>
        <IconBill></IconBill>
      </div>
      {isWaiting && (
        <Fragment>
          <div className={cx("loadingOverlay")}>
            <div class="preloader">
              <svg
                class="cart"
                role="img"
                aria-label="Shopping cart line animation"
                viewBox="0 0 128 128"
                width="128px"
                height="128px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="8"
                >
                  <g class="cart__track" stroke="hsla(0,10%,10%,0.1)">
                    <polyline points="4,4 21,4 26,22 124,22 112,64 35,64 39,80 106,80" />
                    <circle cx="43" cy="111" r="13" />
                    <circle cx="102" cy="111" r="13" />
                  </g>
                  <g class="cart__lines" stroke="currentColor">
                    <polyline
                      class="cart__top"
                      points="4,4 21,4 26,22 124,22 112,64 35,64 39,80 106,80"
                      stroke-dasharray="338 338"
                      stroke-dashoffset="-338"
                    />
                    <g class="cart__wheel1" transform="rotate(-90,43,111)">
                      <circle
                        class="cart__wheel-stroke"
                        cx="43"
                        cy="111"
                        r="13"
                        stroke-dasharray="81.68 81.68"
                        stroke-dashoffset="81.68"
                      />
                    </g>
                    <g class="cart__wheel2" transform="rotate(90,102,111)">
                      <circle
                        class="cart__wheel-stroke"
                        cx="102"
                        cy="111"
                        r="13"
                        stroke-dasharray="81.68 81.68"
                        stroke-dashoffset="81.68"
                      />
                    </g>
                  </g>
                </g>
              </svg>
              <div class="preloader__text">
                <p class="preloader__msg">Đơn Hàng Của Bạn Đang Được Gửi Đi</p>
                <p class="preloader__msg preloader__msg--last">
                  Phản Hồi Quá Lâu, Có Thể Đã Xảy Ra Lỗi
                </p>
              </div>
            </div>
          </div>
        </Fragment>
      )}
      {isUnable && (
        <div className={cx("successContainer")}>
          <div className="successBox">
            <h2 className={cx("successPopup")}>
              Giỏ hàng trống <br /> Vui lòng chọn món
            </h2>
            <button
              className={cx("UnableReturnButton")}
              onClick={cancelHandler3}
            >
              Trở về
            </button>
          </div>
        </div>
      )}
      {isFail && (
        <div className={cx("successContainer")} onClick={cancelHandler2}>
          <div className="failBox">
            <h2 className={cx("failPopup")}>
              Món {foodFailName} còn {amoutRemain} món <br />
              Bạn có muốn điều chỉnh?
            </h2>
            <div className="confirmButtonGroup">
              <button
                className={cx("cancelButton")}
                onClick={() => {
                  setIsFail(false);
                }}
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  setIsFail(false);
                }}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {isConfirm && (
        <div className={cx("successContainer")} onClick={cancelHandler}>
          <div className={cx("successBox")}>
            <h2 className={cx("successPopup")}>Xác Nhận Đặt Món</h2>
            <div className={cx("confirmButtonGroup")}>
              <button className={cx("cancelButton")} onClick={cancelHandler}>
                Huỷ
              </button>
              {/* <button onClick={submitHandler}>Xác Nhận</button> */}
              <button onClick={handleNeedChoosePaymentMethod}>Xác Nhận</button>
            </div>
          </div>
        </div>
      )}
      {isSuccess && (
        <div className={cx("successContainer")}>
          <div className="successBox">
            <h2 className={cx("successPopup")}>Gọi món thành công</h2>
            <button className={cx("returnButton")} onClick={finishHandler}>
              Trở về
            </button>
          </div>
        </div>
      )}
      <div className={cx("topCart")}>
        <button
          className={cx("backButton")}
          onClick={handleBackButton}
        >
          <img src={leftArrow} alt="icon" />
        </button>
        {choosePaymentMethod === "" && (
          <p className={cx("topTitle")}>Món Bạn Đã Chọn</p>
        )}
        {choosePaymentMethod !== "" && (
          <p className={cx("topTitle")}>Thanh Toán</p>
        )}
      </div>
      <hr />
      {choosePaymentMethod === "" && (
        <Fragment>
          <div className={cx("cartBody")}>
            {cartStored.map((food, index) => (
              <div className={cx("cartItem")} key={index}>
                <div className={cx("cartImage")}>
                  <img src={food.img} alt="ảnh" />
                </div>
                <div className={cx("cartInfo")}>
                  <h3>{food.name}</h3>
                  <h5>{food.options}</h5>
                  <div className={cx("itemQuantity")}>
                    <button
                      className={cx("decrease")}
                      onClick={() => decreaseQuantity(index)}
                    >
                      <img src={minusIcon} alt="minus" />
                    </button>
                    <h4 className={cx("quantity")} id={cx(food.id)}>
                      {food.number}
                    </h4>
                    <button
                      className={cx("increase")}
                      onClick={() => increaseQuantity(index)}
                    >
                      <img src={plusIcon} alt="plus" />
                    </button>
                  </div>
                </div>
                <div className={cx("cartAssets")}>
                  <button onClick={() => removeItem(index)}>
                    <img src={xIcon} alt="remove" />
                  </button>
                  <h4>{`${(food.price * food.number).toLocaleString(
                    "vi-VN"
                  )}đ`}</h4>
                </div>
              </div>
            ))}
          </div>
          <div className={cx("cartTotal")}>
            <h2>Bạn đã chọn {cartStored.length} món</h2>
            <hr />
            <div className={cx("totalBill")}>
              <p>Tổng hoá đơn:</p>
              <p id={cx("totalPrice")}>
                {pushData.total.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <div className={cx("cartNote")}>
              <p>Ghi chú:</p>
              <textarea
                value={pushData.note}
                onChange={(e) =>
                  setPushData((prevState) => ({
                    ...prevState,
                    note: e.target.value,
                  }))
                }
              />
            </div>
            <button className={cx("totalBillButton")} onClick={confirmHandler}>
              Gọi Món
            </button>
          </div>
        </Fragment>
      )}
      {choosePaymentMethod === "Pick" && (
        <Fragment>
          <div className={cx("choosePaymentBody")}>
            <div className={cx("margintop")}></div>
            {showGuide && (
              <Fragment>
                <div className={cx("guideOverlay")}>
                </div>
                <div className={cx("guideBox")}>
                  <div className={cx("guideTitle")}>Hướng Dẫn</div>
                  <div className={cx("guideStep1")}>Bước 1: Chọn Ngân Hàng</div>
                  <div className={cx("guideStep2")}>Bước 2: Chụp Ảnh Hoá Đơn Giao Dịch</div>
                  <div className={cx("guideStep3")}>Bước 3: Chọn Ảnh Rồi Ấn Gửi Hoá Đơn</div>
                  <div className={cx("understoodConfirmButton")} onClick={handleUnderStood}>Xác Nhận</div>
                </div>
              </Fragment>
            )}
            <div className={cx("PayByMoneyBox")} onClick={() => handlePickedPaymentMethod("MONEY")}>
              <div className={cx("PayByMoneyIconBorder")}>
                <img src={payByMoneyIcon} alt="$"></img>
              </div>
              <div className={cx("PayByMoneyTitle")}>Thanh Toán Bằng Tiền Mặt</div>
              {pickedPaymentMethod === "MONEY" && (
                <Fragment>
                  <div className={cx("PickedIcon")}>
                    <img src={tickIcon} alt="picked"></img>
                  </div>
                </Fragment>
              )}
            </div>
            <div className={cx("PayByBankBox")} onClick={() => handlePickedPaymentMethod("BANK")}>
              <div className={cx("PayByBankTopContainer")}>
                <div className={cx("PayByBankIconBorder")}>
                  <img src={payByBankIcon} alt="$"></img>
                </div>
                <div className={cx("PayByBankTitle")}>Chuyển Khoản Ngân Hàng</div>
                {pickedPaymentMethod === "BANK" && (
                  <Fragment>
                    <div className={cx("PickedIcon")}>
                      <img src={tickIcon} alt="picked"></img>
                    </div>
                  </Fragment>
                )}
              </div>
              {pickedPaymentMethod === "BANK" && (
                <Fragment>
                  <div className={cx("PayByBankBottomContainer")}>
                    {/* list danh sach bank */}
                    <div className={cx("BankListItem")}>
                      <div className={cx("BankName")} onClick={() => handlePickedBank("TP BANK")}>TP BANK</div>
                      {showBankInforName === "TP BANK" && (
                        <Fragment>
                          <div className={cx("BankQRCode")}>
                            <img src={cloneBankQR}></img>
                          </div>
                          <div className={cx("BankID")}>20869042001
                            <img
                              src={copyIcon}
                              alt="copy"
                              onClick={() => handleCopyClick("20869042001")}
                            ></img></div>
                          <div className={cx("BankOwnerName")}>TONG CHAU BINH</div>
                        </Fragment>
                      )}
                    </div>


                    {/* clone test */}
                    <div className={cx("BankListItem")}>
                      <div className={cx("BankName")} onClick={() => handlePickedBank("BIDV")}>BIDV</div>
                      {showBankInforName === "BIDV" && (
                        <Fragment>
                          <div className={cx("BankQRCode")}>
                            <img src={cloneBankQR}></img>
                          </div>
                          <div className={cx("BankID")}>
                            20869042001
                            <img
                              src={copyIcon}
                              alt="copy"
                              onClick={() => handleCopyClick("20869042001")}
                            ></img>
                          </div>
                          <div className={cx("BankOwnerName")}>TONG CHAU BINH BIDV</div>
                        </Fragment>
                      )}
                    </div>

                    <div className={cx("BankListItem")}>
                      <div className={cx("BankName")} onClick={() => handlePickedBank("VIETINBANK")}>VIETINBANK</div>
                      {showBankInforName === "VIETINBANK" && (
                        <Fragment>
                          <div className={cx("BankQRCode")}>
                            <img src={cloneBankQR}></img>
                          </div>
                          <div className={cx("BankID")}>
                            20869042001
                            <img
                              src={copyIcon}
                              alt="copy"
                              onClick={() => handleCopyClick("20869042001")}
                            ></img>
                          </div>
                          <div className={cx("BankOwnerName")}>TONG CHAU BINH VIETINBANK</div>
                        </Fragment>
                      )}
                    </div>

                    {/* clone test */}
                    <div className={cx("AddImage", { active: isActive })}>
                      {/* <label htmlFor="image_detail">Ảnh Minh Hoạ:</label> */}
                      <div className="custom-file">
                        <input
                          onChange={handleFileInputChange}
                          type="file"
                          id="image_detail"
                          name="image_detail"
                          accept="image/png,image/jpeg,image/jpg"
                          required
                          className="custom-file-input"
                        />
                        <label
                          id="file-label"
                          className="custom-file-label"
                          htmlFor="image_detail"
                        >
                          Thêm Ảnh Giao Dịch
                        </label>
                      </div>
                    </div>
                  </div>
                </Fragment>

              )}
            </div>
          </div>
        </Fragment>
      )}
      {pickedPaymentMethod !== "" && (
        <Fragment>
          <button id="confirmPaymentButton" onClick={() => { sendBill(pickedPaymentMethod) }}>Gửi Hoá Đơn</button>
        </Fragment>
      )}
    </div>
  );
}

export default Cart;
