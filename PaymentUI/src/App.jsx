import { Box, Container } from "@mui/material";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at top left, #172554 0%, transparent 30%),
          radial-gradient(circle at bottom right, #0f766e 0%, transparent 25%),
          linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <Box
          sx={{
            backdropFilter: "blur(24px)",
            background:
              "rgba(255,255,255,0.08)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            borderRadius: "32px",

            p: {
              xs: 2,
              md: 4,
            },

            boxShadow:
              "0 20px 60px rgba(0,0,0,0.45)",

            overflow: "hidden",
          }}
        >
          <CheckoutPage />
        </Box>
      </Container>
    </Box>
  );
}

export default App;