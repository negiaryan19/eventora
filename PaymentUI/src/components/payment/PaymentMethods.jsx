import {
    Box,
    Stack,
    Typography,
} from "@mui/material";

import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { motion } from "framer-motion";

import { usePayment } from "../../context/PaymentContext";

const methods = [
    {
        id: "card",
        label: "Card",
        icon: <CreditCardIcon />,
    },
    {
        id: "upi",
        label: "UPI",
        icon: <AccountBalanceWalletIcon />,
    },
    {
        id: "banking",
        label: "Net Banking",
        icon: <AccountBalanceIcon />,
    },
];

function PaymentMethods() {
    const { state, dispatch } = usePayment();

    return (
        <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
        >
            {methods.map((method) => {
                const active =
                    state.selectedMethod === method.id;

                return (
                    <Box
                        key={method.id}
                        onClick={() =>
                            dispatch({
                                type: "SET_METHOD",
                                payload: method.id,
                            })
                        }
                        sx={{
                            flex: 1,
                            minWidth: "140px",
                            p: 2,
                            borderRadius: "18px",
                            cursor: "pointer",
                            transition: "0.3s ease",

                            background: active
                                ? "linear-gradient(135deg, rgba(124,77,255,0.35), rgba(0,229,255,0.2))"
                                : "rgba(255,255,255,0.06)",

                            border: active
                                ? "1px solid rgba(124,77,255,0.6)"
                                : "1px solid rgba(255,255,255,0.1)",

                            transform: active
                                ? "translateY(-4px)"
                                : "translateY(0px)",

                            "&:hover": {
                                transform: "translateY(-4px)",
                                background:
                                    "rgba(255,255,255,0.12)",
                            },
                            backdropFilter: "blur(12px)",

                            boxShadow: active
                                ? "0 10px 25px rgba(124,77,255,0.25)"
                                : "none",
                        }}
                    >
                        <Stack
                            spacing={1}
                            alignItems="center"
                        >
                            {method.icon}

                            <Typography fontWeight={600}>
                                {method.label}
                            </Typography>
                        </Stack>
                    </Box>
                );
            })}
        </Stack>
    );
}

export default PaymentMethods;