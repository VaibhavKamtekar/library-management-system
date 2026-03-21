import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";

export default function PortalShell({
  eyebrow,
  title,
  subtitle,
  accent = "#1769aa",
  sideTitle,
  sideText,
  highlights = [],
  children,
  maxWidth = "lg"
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 32%), linear-gradient(135deg, #0f172a 0%, #132238 45%, #1c3551 100%)"
      }}
    >
      <Container maxWidth={maxWidth}>
        <Paper
          elevation={18}
          sx={{
            overflow: "hidden",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(8, 15, 26, 0.72)",
            backdropFilter: "blur(14px)"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(240px, 320px) 1fr" }
            }}
          >
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                color: "#e8f1ff",
                background: `linear-gradient(180deg, ${accent} 0%, rgba(13, 26, 44, 0.92) 100%)`
              }}
            >
              {eyebrow && (
                <Chip
                  label={eyebrow}
                  size="small"
                  sx={{
                    color: "#eaf4ff",
                    border: "1px solid rgba(255,255,255,0.28)",
                    background: "rgba(255,255,255,0.08)"
                  }}
                />
              )}

              <Typography variant="h3" sx={{ mt: 2, fontWeight: 800, lineHeight: 1.05 }}>
                {title}
              </Typography>

              <Typography sx={{ mt: 2, color: "rgba(232,241,255,0.82)", lineHeight: 1.7 }}>
                {subtitle}
              </Typography>

              {(sideTitle || sideText || highlights.length > 0) && (
                <Box sx={{ mt: 5 }}>
                  {sideTitle && (
                    <Typography variant="overline" sx={{ letterSpacing: 1.6, opacity: 0.8 }}>
                      {sideTitle}
                    </Typography>
                  )}
                  {sideText && (
                    <Typography sx={{ mt: 1.5, color: "rgba(232,241,255,0.82)", lineHeight: 1.7 }}>
                      {sideText}
                    </Typography>
                  )}
                  {highlights.length > 0 && (
                    <Stack spacing={1.5} sx={{ mt: 3 }}>
                      {highlights.map((item) => (
                        <Box
                          key={item}
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)"
                          }}
                        >
                          <Typography variant="body2">{item}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ p: { xs: 3, md: 4 } }}>{children}</Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
