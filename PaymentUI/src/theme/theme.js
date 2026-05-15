import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",

        primary: {
            main: "#7c4dff",
        },

        secondary: {
            main: "#00e5ff",
        },

        background: {
            default: "#020617",
            paper: "rgba(255,255,255,0.06)",
        },
    },

    typography: {
        fontFamily: "'Inter', sans-serif",

        h4: {
            fontWeight: 700,
            letterSpacing: "-1px",
        },

        h5: {
            fontWeight: 700,
        },

        button: {
            textTransform: "none",
            fontWeight: 700,
        },
    },

    shape: {
        borderRadius: 18,
    },

    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: "16px",

                        background:
                            "rgba(255,255,255,0.04)",

                        transition: "all 0.3s ease",

                        "& fieldset": {
                            border:
                                "1px solid rgba(255,255,255,0.08)",
                        },

                        "&:hover fieldset": {
                            border:
                                "1px solid rgba(124,77,255,0.5)",
                        },

                        "&.Mui-focused fieldset": {
                            border:
                                "1px solid #7c4dff",
                            boxShadow:
                                "0 0 0 4px rgba(124,77,255,0.15)",
                        },
                    },
                },
            },
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "16px",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.25)",

                    transition: "all 0.3s ease",

                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow:
                            "0 15px 35px rgba(0,0,0,0.35)",
                    },
                    "&.Mui-disabled": {
                        background:
                            "rgba(255,255,255,0.12)",

                        color:
                            "rgba(255,255,255,0.5)",
                    },
                },
            },
        },
    },
});

export default theme;