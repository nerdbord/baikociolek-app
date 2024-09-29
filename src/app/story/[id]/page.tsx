/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import { useState, useEffect, useRef } from "react";
import {
  createStep,
  fetchStoryById,
  generateStoryStepAudioSlice,
  generateStoryStepTextSlice,
} from "@/app/_actions/story.actions";
import { useParams } from "next/navigation";
import { Step } from "@prisma/client";

export default function StarWarsNarrative() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [storySteps, setStorySteps] = useState<Step[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const params = useParams();

  useEffect(() => {
    fetchStoryById(params.id as string).then((story) => {
      if (story) {
        setStorySteps(story.steps);
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (
      started &&
      storySteps[currentStep]?.type === "NARRATION" &&
      audioRef.current
    ) {
      // @ts-expect-error
      audioRef.current.src = storySteps[currentStep].audioUrl;
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
      setIsAudioPlaying(true);
    }
  }, [currentStep, started, storySteps]);

  const handleAudioEnd = () => {
    setIsAudioPlaying(false);
    const isLastStep = currentStep === storySteps.length - 1;

    if (isLastStep) {
      setStarted(false);
      return;
    }

    if (currentStep < storySteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleDecision = async (option: string) => {
    // Check if there's already a decision step available after the current step
    const nextStepIndex = currentStep + 1;
    if (
      nextStepIndex < storySteps.length &&
      storySteps[nextStepIndex]?.type === "NARRATION"
    ) {
      // If a next step is available, just move to the next step
      setCurrentStep((prev) => prev + 1);
      return;
    }

    const stepId = `step-${Date.now()}`;
    const storyId = "your-story-id"; // Replace with actual story ID
    const context = storySteps
      .filter((step): step is Step => step.type === "NARRATION")
      .map((step) => step.content)
      .join(" ");

    const previousDecisions = storySteps
      .filter((step): step is Step => step.type === "DECISION")
      .map((decision) => decision.question || "");

    try {
      setIsGenerating(true);

      // Generate text for the next step based on context and decision
      const nextSteps = await generateStoryStepTextSlice({
        context,
        text: option,
        storyId,
        stepId,
        previousDecisions,
      });

      if (!nextSteps) {
        throw new Error("Failed to generate text for the story step.");
      }

      const { narrativeStep, decisionStep } = nextSteps;

      const audioPath = await generateStoryStepAudioSlice({
        text: narrativeStep,
        stepId,
        storyId,
      });

      if (!audioPath && typeof audioPath !== "string") {
        throw new Error("Failed to generate audio for the story step.");
      }

      // Create new narration step with the audio URL
      const newNarrativeStep: Step = {
        id: stepId,
        type: "NARRATION",
        content: narrativeStep,
        audioUrl: audioPath as string,
        question: null,
        options: [],
        selectedOption: null,
        storyId: storyId,
        order: storySteps.length,
      };

      const newDecisionStep: Step = {
        id: stepId,
        type: "DECISION",
        content: "",
        audioUrl: null,
        question: decisionStep.text,
        options: decisionStep.options,
        selectedOption: null,
        storyId: storyId,
        order: storySteps.length + 1,
      };

      // Update the story steps
      setStorySteps((prevSteps) => [
        ...prevSteps,
        newNarrativeStep,
        newDecisionStep,
      ]);
      setCurrentStep((prev) => prev + 1);

      await createStep(storyId, newNarrativeStep);
      await createStep(storyId, newDecisionStep);
    } catch (error) {
      console.error("Error generating next story step:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative h-screen bg-black overflow-scroll p-6">
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            onClick={() => setStarted(true)}
          >
            Start Narrative
          </button>
        </div>
      )}

      {started && (
        <div>
          {storySteps.map((step, index) => (
            <div
              key={index}
              className={`transition-opacity duration-500 ${
                index <= currentStep ? "opacity-100" : "opacity-0"
              } ${step.type === "NARRATION" ? "text-yellow-500" : ""}`}
            >
              {step.type === "NARRATION" && (
                <p className="text-3xl font-bold leading-relaxed mb-6">
                  {step.content}
                </p>
              )}
              {step.type === "DECISION" && !isAudioPlaying && (
                <div className="text-center space-y-4">
                  <p className="text-white text-xl mb-4">{step.content}</p>
                  {isGenerating ? (
                    // Loading Indicator
                    <div className="flex justify-center items-center">
                      <div className="loader">Generating...</div>
                    </div>
                  ) : (
                    // Decision Options
                    step.options.map((option, index) => (
                      <button
                        key={index}
                        disabled={isGenerating}
                        className="bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                        onClick={() => handleDecision(option)}
                      >
                        {option}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        </div>
      )}
    </div>
  );
}
