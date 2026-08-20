import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function ThemeToggleButton({ mode, onToggle }) {
  const theme = useTheme();

  return (
    <Button
      variant="outlined"
      onClick={onToggle}
      sx={{
        minWidth: 152,
        py: 1.1,
        px: 2.25,
        borderRadius: 999,
        fontWeight: 700,
        textTransform: "none",
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        backgroundColor: "rgba(255,255,255,0.26)",
        backdropFilter: "blur(6px)",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.action.hover
        }
      }}
    >
      {mode === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}
