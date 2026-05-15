import {
  createContext,
  useContext,
  useReducer,
} from "react";

const PaymentContext = createContext();

const initialState = {
  selectedMethod: "card",
  processing: false,
  paymentSuccess: false,
};

function paymentReducer(state, action) {
  switch (action.type) {
    case "SET_METHOD":
      return {
        ...state,
        selectedMethod: action.payload,
      };

    case "SET_PROCESSING":
      return {
        ...state,
        processing: action.payload,
      };

    case "PAYMENT_SUCCESS":
      return {
        ...state,
        paymentSuccess: true,
        processing: false,
      };

    default:
      return state;
  }
}

export function PaymentProvider({ children }) {
  const [state, dispatch] = useReducer(
    paymentReducer,
    initialState
  );

  return (
    <PaymentContext.Provider
      value={{ state, dispatch }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  return useContext(PaymentContext);
}