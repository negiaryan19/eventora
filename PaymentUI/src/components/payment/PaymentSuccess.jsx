import {
  Dialog,
  DialogContent,
  Typography,
  Box,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { motion } from "framer-motion";

function PaymentSuccess({ open }) {
  return (
    <Dialog open={open}>
      <DialogContent
        sx={{
          textAlign: "center",
          p: 5,
          background:
            "linear-gradient(135deg, #111827, #1e293b)",
        }}
      >
        <motion.div
          initial={{
            scale: 0,
            rotate: -180,
          }}
          animate={{
            scale: 1,
            rotate: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 120,
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: "#00e676",
            }}
          />
        </motion.div>

        <Typography
          variant="h5"
          mt={3}
          fontWeight={700}
        >
          Payment Successful
        </Typography>

        <Typography
          mt={2}
          color="gray"
        >
          Your transaction has been completed.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentSuccess;