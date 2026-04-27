import React from 'react';

const QuizQuestionCard = ({ question, index, selectedAnswer, onSelect }) => {
  return (
    <article className="rounded-3xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
      <h4 className="text-2xl font-black text-[#173B2F]">
        {index + 1}. {question.question}
      </h4>
      <div className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => {
          const checked = selectedAnswer === optionIndex;
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                checked ? 'border-[#1F6B3A] bg-[#EEF6EA]' : 'border-[#DDE5D8] bg-white'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={checked}
                onChange={() => onSelect(optionIndex)}
              />
              <span className="text-sm text-[#173B2F]">{option}</span>
            </label>
          );
        })}
      </div>
    </article>
  );
};

export default QuizQuestionCard;
