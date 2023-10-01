import React, { useState, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames/bind";
import style from "../Cart/Cart.scss";
import axios from "axios";
import { VietQR } from "vietqr";
import leftArrow from "../../assets/image/left-arrow.png";
import payByMoneyIcon from "../../assets/image/moneyicon.png";
import payByBankIcon from "../../assets/image/bankicon.png";
import tickIcon from "../../assets/image/tick icon.png";
import copyIcon from "../../assets/image/copyICON.png";
import Loading from "../../components/loadingScreen/loading";
import IconBill from "../../components/IconBill";
const cx = classNames.bind(style);

function PaymentMethod() {
    const navigate = useNavigate();
    const { paymentid } = useParams();
    const [copyText, setCopyText] = useState("");
    const [choosePaymentMethod, setChoosePaymentMethod] = useState("Pick");
    const [pickedPaymentMethod, setPickedPaymentMethod] = useState("");
    const [cartStored, setCartStored] = useState([]);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isFail, setIsFail] = useState(false);
    const [needImage, setNeedImage] = useState(false);
    const [isUnable, setIsUnable] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [qrGenerated, setQrGenerated] = useState(false);
    const [allActive, setAllActive] = useState([]);
    const [foodFailName, setFoodFailName] = useState("");
    const [bankBin, setBankBin] = useState("");
    const [bankNumber, setBankNumber] = useState("20869042001");
    const [qrURL, setQrURL] = useState(null);
    const [showBankInforName, setShowBankInforName] = useState("TpBank");
    const [needImageMsg, setNeedImageMsg] = useState("");
    const [amoutRemain, setAmountRemain] = useState(0);
    const [paymentImage, setPaymentImage] = useState({
        image_payment: null,
    });
    const [pushData, setPushData] = useState({
        note: "",
        total: "",
        table: "",
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
    let cart_id = paymentid;
    const group_id = sessionStorage.getItem("group_id") || 0;

    const vietQR = new VietQR({
        clientID: '4244e11f-e282-4e3c-af39-6d9749c99e44',
        apiKey: '2f317b30-113a-45c5-aaf7-192d8926a15f',
    });
    //get active dish
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

    //get bank bin
    useEffect(() => {
        if (showBankInforName && bankNumber) {
            vietQR
                .getBanks()
                .then((banks) => {
                    let filtedBank = banks.data.filter(bank => bank.shortName === showBankInforName);
                    if (filtedBank.length > 0) {
                        setBankBin(filtedBank[0].bin)
                    } else {
                        console.error('Bank not found:', showBankInforName);
                    }
                })
                .catch((err) => {
                    console.error('Error fetching banks:', err);
                })
        }
    }, [showBankInforName]);

    //get qr
    useEffect(() => {
        setQrGenerated(false)
        if (bankBin !== null) {
            vietQR
                .genQRCodeBase64({
                    "accountNumber": bankNumber,
                    "accountName": "TONG CHAU BINH",
                    "bank": bankBin,
                    "amount": getTotalBill(),
                    "addInfo": `Thanh Toan Ban ${tableStored}`,
                    "format": "text",
                    "template": "compact"
                })
                .then((data) => {
                    console.log(data);
                    if (data.data.data) {
                        setQrURL(data.data.data.qrDataURL);
                        setQrGenerated(true);
                    }
                })
                .catch((err) => {
                    console.error('Error generating QR code:', err);
                });
        };
    }, [bankBin]);



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

    const cancelHandler2 = () => {
        setIsFail(false);
    };

    const cancelHandler3 = () => {
        setIsUnable(false);
    };

    const finishHandler = () => {
        navigate("/showall");
        sessionStorage.removeItem("obj");
    };

    const sendBill = (payMethod) => {
        setIsWaiting(true);
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
                            axios
                                .put(`${process.env.REACT_APP_API_URL}/cart/selectCashMethod/${cart_id}`)
                                .then((response) => {
                                    if (response.data) {
                                        setIsSuccess(true)
                                        setIsWaiting(false)
                                    }
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                        }
                        if (payMethod === "BANK") {
                            if (isActive === false) {
                                setNeedImage(true)
                                setNeedImageMsg("Vui Lòng Thêm Ảnh Giao Dịch")
                                setIsWaiting(false)
                            } else {
                                const formData = new FormData();
                                formData.append("image_payment", paymentImage.image_payment)
                                const formDataObj = {};
                                formData.forEach((value, key) => {
                                    formDataObj[key] = value;
                                })
                                axios
                                    .put(`${process.env.REACT_APP_API_URL}/cart/payByCustomer/${cart_id}`, formData)
                                    .then((response) => {
                                        if (response.data) {
                                            setIsSuccess(true)
                                            setIsWaiting(false)
                                        }
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    });
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
        navigate("/showall")
    }

    const handlePickedBank = (name, number) => {
        setShowBankInforName(name);
        setBankNumber(number)
    }

    const handlePickedPaymentMethod = (value) => {
        setPickedPaymentMethod(value)
        if (value !== "BANK") {
            setShowBankInforName("")
            setIsActive(false)
            setPaymentImage({
                image_payment: null,
            });
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

    const handleSaveQR = () => {
        // Tạo một đối tượng <a> để tạo liên kết tải ảnh
        const a = document.createElement('a');
        a.href = qrURL;
        a.download = `PayByQrScanTo${showBankInforName}.png`; // Đặt tên cho tập tin được tải về

        a.click();
    };

    function handleFileInputChange(event) {
        const fileInput = event.target;
        const fileLabel = document.getElementById("file-label");
        const file = event.target.files[0];
        if (fileInput.files && fileInput.files.length > 0) {
            // setState({ ...state, [event.target.name]: file });
            setPaymentImage({ image_payment: file })
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
            {choosePaymentMethod === "" && (
                <div className={cx("cartSpecial")}>
                    <IconBill></IconBill>
                </div>
            )}

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
            {needImage && (
                <div className={cx("successContainer")} onClick={cancelHandler2}>
                    <div className="failBox">
                        <h2 className={cx("failPopup")}>
                            Hãy Thêm Ảnh Giao Dịch
                        </h2>
                        <div className="confirmButtonGroup">
                            <button
                                className={cx("cancelButton")}
                                onClick={() => {
                                    setNeedImage(false);
                                }}
                            >
                                Xác Nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={cx("topCart")}>
                {choosePaymentMethod === "" && (
                    <p className={cx("topTitle")}>Món Bạn Đã Chọn</p>
                )}
                {choosePaymentMethod !== "" && (
                    <p className={cx("topTitle")}>Thanh Toán</p>
                )}
            </div>
            <hr />
            <div>
                {choosePaymentMethod === "Pick" && (
                    <Fragment>
                        <div className={cx("choosePaymentBody")}>
                            <div>
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
                                        <div className={cx("PayByBankTitle")}>Chuyển Khoản Bằng Mã QR</div>
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
                                                    <div className={cx("BankName")} onClick={() => handlePickedBank("TPBank", "20869042001")}>TPBank</div>
                                                    {showBankInforName === "TPBank" && (
                                                        <Fragment>
                                                            {qrGenerated && (
                                                                <div className={cx("BankQRCode")}>
                                                                    <img src={qrURL} alt="QR-CODE"></img>
                                                                </div>
                                                            )}
                                                            <div className={cx("BankQRSaved")}>
                                                                <button onClick={handleSaveQR}>
                                                                    Lưu Mã QR
                                                                </button>
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

                                                <div className={cx("BankListItem")}>
                                                    <div className={cx("BankName")} onClick={() => handlePickedBank("VietinBank", "105869252053")}>VietinBank</div>
                                                    {showBankInforName === "VietinBank" && (
                                                        <Fragment>
                                                            {qrGenerated && (
                                                                <div className={cx("BankQRCode")}>
                                                                    <img src={qrURL} alt="QR-CODE"></img>
                                                                </div>
                                                            )}
                                                            <div className={cx("BankQRSaved")}>
                                                                <button onClick={handleSaveQR}>
                                                                    Lưu Mã QR
                                                                </button>
                                                            </div>

                                                            <div className={cx("BankID")}>
                                                                105869252053
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

                            {pickedPaymentMethod !== "" && (
                                <Fragment>
                                    <button id="confirmPaymentButton" onClick={() => { sendBill(pickedPaymentMethod) }}>Gửi Hoá Đơn</button>
                                </Fragment>
                            )}
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
    );
}

export default PaymentMethod;
