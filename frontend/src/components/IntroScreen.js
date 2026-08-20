import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import introVideo from "../assets/vortex_intro.mp4";

const INTRO_CUTOFF_SECONDS = 3.85;

export default function IntroScreen({ setScreen, setAnimateDashboard }) {
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasTransitionedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const finishIntro = useCallback(() => {
    if (hasTransitionedRef.current) {
      return;
    }

    hasTransitionedRef.current = true;
    setFadingOut(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setAnimateDashboard(true);
    setScreen("home");
  }, [setAnimateDashboard, setScreen]);

  const watchVideoTime = useCallback(() => {
    if (!videoRef.current || hasTransitionedRef.current) {
      return;
    }

    if (videoRef.current.currentTime >= INTRO_CUTOFF_SECONDS) {
      finishIntro();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(watchVideoTime);
  }, [finishIntro]);

  const handleTimeUpdate = () => {
    if (videoRef.current?.currentTime >= INTRO_CUTOFF_SECONDS) {
      finishIntro();
    }
  };

  const startMagic = () => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play();
      animationFrameRef.current = requestAnimationFrame(watchVideoTime);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        zIndex: 9999,
        transition: "opacity 0.3s ease-out",
        opacity: fadingOut ? 0 : 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
      onClick={!isPlaying ? startMagic : undefined}
    >
      <video
        ref={videoRef}
        src={introVideo}
        onTimeUpdate={handleTimeUpdate}
        onEnded={finishIntro}
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none"
        }}
      />

      {/* Invisible overlay with text prompt before playing */}
      {!isPlaying && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.4)",
            cursor: "pointer",
            transition: "opacity 0.5s ease",
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: { xs: 20, md: 28 },
              fontWeight: 300,
              letterSpacing: 4,
              textTransform: "uppercase",
              animation: "pulse 2s infinite"
            }}
          >
            Click to Enter
          </Typography>
        </Box>
      )}

      {/* Adding the pulse animation via inline style tag for simplicity */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
            100% { opacity: 0.6; transform: scale(0.98); }
          }
        `}
      </style>
    </Box>
  );
}
