"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useId, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useLoginRequired } from "@/components/auth/LoginRequiredProvider";
import {
  FeedbackSubmissionModal,
  type FeedbackSubmissionModalKind,
} from "@/components/feedback/FeedbackSubmissionModal";
import { FEEDBACK_LIMITS } from "@/lib/feedback/feedbackValidation";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";

const FEEDBACK_PLACEHOLDER =
  "Tell us about your experience with IMMIFIN. What do you like? What could be improved? What tools would you like to see?";

type PublicationChoice = boolean | null;

type FieldErrors = {
  rating?: string;
  feedbackText?: string;
  displayName?: string;
  publicationPermission?: string;
};

export function resolveSuccessfulFeedbackModalKind(
  submittedPublicationPermission: boolean,
  resultPublicationPermission?: boolean,
): Extract<FeedbackSubmissionModalKind, "success-private" | "success-public"> {
  const successfulPublicationPermission =
    typeof resultPublicationPermission === "boolean"
      ? resultPublicationPermission
      : submittedPublicationPermission;
  return successfulPublicationPermission ? "success-public" : "success-private";
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.6 13.7 8.8 19.3 9.2 15.1 12.7 16.5 18.1 12 15.4 7.5 18.1 8.9 12.7 4.7 9.2 10.3 8.8 12 3.6Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareFeedbackForm() {
  const { isLoaded, isSignedIn } = useAuth();
  const { showLoginRequired } = useLoginRequired();
  const pathname = usePathname();
  const formId = useId();
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [publicationPermission, setPublicationPermission] = useState<PublicationChoice>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalKind, setModalKind] = useState<FeedbackSubmissionModalKind | null>(null);

  const ratingLabelId = `${formId}-rating-label`;
  const ratingErrorId = `${formId}-rating-error`;
  const feedbackErrorId = `${formId}-feedback-error`;
  const displayNameErrorId = `${formId}-name-error`;
  const publicationErrorId = `${formId}-permission-error`;
  const formErrorId = `${formId}-form-error`;

  const closeModal = useCallback(() => {
    setModalKind(null);
  }, []);

  function resetForm() {
    setRating(null);
    setFeedbackText("");
    setDisplayName("");
    setPublicationPermission(null);
    setFieldErrors({});
    setFormError(null);
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (rating === null || rating < FEEDBACK_LIMITS.ratingMin || rating > FEEDBACK_LIMITS.ratingMax) {
      next.rating = "Please select a rating from 1 to 5.";
    }
    const trimmedFeedback = feedbackText.trim();
    if (
      trimmedFeedback.length < FEEDBACK_LIMITS.feedbackTextMin ||
      trimmedFeedback.length > FEEDBACK_LIMITS.feedbackTextMax
    ) {
      next.feedbackText = "Please enter between 10 and 1,000 characters.";
    }
    const trimmedName = displayName.trim();
    if (trimmedName.length > FEEDBACK_LIMITS.displayNameMax) {
      next.displayName = "Display name must be 50 characters or fewer.";
    }
    if (publicationPermission !== true && publicationPermission !== false) {
      next.publicationPermission = "Please choose how IMMIFIN may use your feedback.";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setFormError(null);
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      showLoginRequired(pathname || "/about/share-feedback");
      return;
    }

    const trimmedName = displayName.trim();
    const payload: {
      rating: number;
      feedbackText: string;
      publicationPermission: boolean;
      displayName?: string;
    } = {
      rating: rating!,
      feedbackText: feedbackText.trim(),
      publicationPermission: publicationPermission === true,
    };
    if (trimmedName) {
      payload.displayName = trimmedName;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setModalKind("throttle");
        return;
      }

      const result = await readJsonResponseBody<{
        success?: boolean;
        error?: string;
        feedback?: { publicationPermission?: boolean };
      }>(response);

      if (response.status === 401) {
        showLoginRequired(pathname || "/about/share-feedback");
        return;
      }

      if (!result.ok) {
        if (response.status >= 500) {
          setModalKind("system");
          return;
        }
        setFormError(result.error || "Please check your feedback and try again.");
        return;
      }

      const nextSuccessKind = resolveSuccessfulFeedbackModalKind(
        payload.publicationPermission,
        result.data.feedback?.publicationPermission,
      );

      resetForm();
      setModalKind(nextSuccessKind);
    } catch {
      setModalKind("system");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ds2-share-form-card" aria-labelledby={`${formId}-heading`}>
      <p className="ds2-share-form-kicker">Share Your Experience</p>
      <h2 id={`${formId}-heading`} className="ds2-share-form-title">
        We&apos;d love to hear from you.
      </h2>
      <p className="ds2-share-form-intro">Your feedback helps IMMIFIN improve.</p>

      <form className="ds2-share-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="ds2-share-fieldset">
          <legend id={ratingLabelId} className="ds2-share-label">
            Overall rating <span aria-hidden="true">*</span>
          </legend>
          <div
            className="ds2-share-stars"
            role="radiogroup"
            aria-labelledby={ratingLabelId}
            aria-describedby={fieldErrors.rating ? ratingErrorId : undefined}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.rating)}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const checked = rating === value;
              const filled = rating !== null && value <= rating;
              return (
                <label key={value} className={`ds2-share-star${filled ? " is-filled" : ""}`}>
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={checked}
                    onChange={() => {
                      setRating(value);
                      setFieldErrors((current) => ({ ...current, rating: undefined }));
                    }}
                  />
                  <span className="sr-only">{value === 1 ? "1 star" : `${value} stars`}</span>
                  <StarIcon filled={filled} />
                </label>
              );
            })}
          </div>
          <p className="ds2-share-hint">Click to select a rating</p>
          {fieldErrors.rating ? (
            <p id={ratingErrorId} className="ds2-share-field-error" role="alert">
              {fieldErrors.rating}
            </p>
          ) : null}
        </fieldset>

        <div className="ds2-share-field">
          <label htmlFor={`${formId}-feedback`} className="ds2-share-label">
            Your feedback <span aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${formId}-feedback`}
            name="feedbackText"
            required
            minLength={FEEDBACK_LIMITS.feedbackTextMin}
            maxLength={FEEDBACK_LIMITS.feedbackTextMax}
            rows={5}
            placeholder={FEEDBACK_PLACEHOLDER}
            value={feedbackText}
            aria-invalid={Boolean(fieldErrors.feedbackText)}
            aria-describedby={`${formId}-feedback-count${fieldErrors.feedbackText ? ` ${feedbackErrorId}` : ""}`}
            onChange={(event) => {
              setFeedbackText(event.target.value);
              setFieldErrors((current) => ({ ...current, feedbackText: undefined }));
            }}
          />
          <div className="ds2-share-field-meta">
            <p className="ds2-share-hint">Minimum 10 characters</p>
            <p id={`${formId}-feedback-count`} className="ds2-share-counter">
              {feedbackText.length} / {FEEDBACK_LIMITS.feedbackTextMax}
            </p>
          </div>
          {fieldErrors.feedbackText ? (
            <p id={feedbackErrorId} className="ds2-share-field-error" role="alert">
              {fieldErrors.feedbackText}
            </p>
          ) : null}
        </div>

        <fieldset className="ds2-share-fieldset">
          <legend className="ds2-share-label">
            How may IMMIFIN use your feedback? <span aria-hidden="true">*</span>
          </legend>
          <div
            className="ds2-share-choice-grid"
            role="radiogroup"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.publicationPermission)}
            aria-describedby={fieldErrors.publicationPermission ? publicationErrorId : undefined}
          >
            <label className={`ds2-share-choice${publicationPermission === false ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="publicationPermission"
                value="private"
                checked={publicationPermission === false}
                onChange={() => {
                  setPublicationPermission(false);
                  setFieldErrors((current) => ({ ...current, publicationPermission: undefined }));
                }}
              />
              <span className="ds2-share-choice-title">Private feedback to IMMIFIN</span>
              <span className="ds2-share-choice-copy">Your feedback will not be displayed publicly.</span>
            </label>
            <label className={`ds2-share-choice${publicationPermission === true ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="publicationPermission"
                value="public"
                checked={publicationPermission === true}
                onChange={() => {
                  setPublicationPermission(true);
                  setFieldErrors((current) => ({ ...current, publicationPermission: undefined }));
                }}
              />
              <span className="ds2-share-choice-title">IMMIFIN may publish my feedback</span>
              <span className="ds2-share-choice-copy">
                Your feedback may appear publicly only after IMMIFIN reviews and approves it.
              </span>
            </label>
          </div>
          {fieldErrors.publicationPermission ? (
            <p id={publicationErrorId} className="ds2-share-field-error" role="alert">
              {fieldErrors.publicationPermission}
            </p>
          ) : null}
        </fieldset>

        <div className="ds2-share-field">
          <label htmlFor={`${formId}-display-name`} className="ds2-share-label">
            Display name <span className="ds2-share-optional">(optional)</span>
          </label>
          <input
            id={`${formId}-display-name`}
            name="displayName"
            type="text"
            maxLength={FEEDBACK_LIMITS.displayNameMax}
            autoComplete="nickname"
            placeholder="Enter your name or a display name"
            value={displayName}
            aria-invalid={Boolean(fieldErrors.displayName)}
            aria-describedby={`${formId}-name-help ${formId}-name-count${fieldErrors.displayName ? ` ${displayNameErrorId}` : ""}`}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setFieldErrors((current) => ({ ...current, displayName: undefined }));
            }}
          />
          <div className="ds2-share-field-meta">
            <p id={`${formId}-name-help`} className="ds2-share-hint">
              If left blank and published, we&apos;ll use IMMIFIN User.
            </p>
            <p id={`${formId}-name-count`} className="ds2-share-counter">
              {displayName.length} / {FEEDBACK_LIMITS.displayNameMax}
            </p>
          </div>
          {fieldErrors.displayName ? (
            <p id={displayNameErrorId} className="ds2-share-field-error" role="alert">
              {fieldErrors.displayName}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p id={formErrorId} className="ds2-share-form-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="ds2-share-submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Feedback"}
          {submitting ? null : <span aria-hidden="true"> →</span>}
        </button>
        <p className="ds2-share-secure-note">Your feedback is secure and will be reviewed by our team.</p>
      </form>
      <FeedbackSubmissionModal kind={modalKind} onClose={closeModal} />
    </section>
  );
}
