import { createTheme } from "@mui/material/styles";

export const orange = "#f28c28";
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: orange },
    background: { default: "#0b0b0b", paper: "#151515" },
    text: { primary: "#f4f4f4", secondary: "#a7a7a7" },
    success: { main: "#33c37d" },
    info: { main: "#4da3ff" },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif',
    h1: { fontWeight: 750, letterSpacing: "-0.04em" },
    h2: { fontWeight: 700, letterSpacing: "-0.03em" },
    button: { fontWeight: 700, letterSpacing: ".02em" },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid #2a2a2a" } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#292929", fontVariantNumeric: "tabular-nums" } } },
  },
});
