import React, { useState } from 'react';
import api from '../services/apiService';


export function PositiveMessageFeedbackWidget({ messageInfo }) {
    const [feedbackDetails, setFeedbackDetails] = useState('');


    if (!messageInfo) {
        return null;
    }


    const handleSubmit = async (e) => {
        e.preventDefault();

        // call api to submit the positive feedback
        try {
            await api.post('/chat/messages/feedback', {
                messageId: messageInfo.messageId,
                feedback: {
                    type: 'positive',
                    details: feedbackDetails || ""
                }
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
        document.getElementById('positive_feedback_modal').close(); // Close the modal
    }


    return (
        <dialog id="positive_feedback_modal" className="modal">
            <div className="modal-box text-left font-gilda">
                <h3 className="font-bold text-lg">Feedback</h3>
                <p className="py-2">{"Please provide details: (optional)"}</p>
                <textarea
                    className="textarea textarea-bordered w-full px-2"
                    placeholder="What was satisfying about this response?"
                    rows="4"
                    onChange={(e) => { setFeedbackDetails(e.target.value) }}
                ></textarea>
                <p className="py-2 font-light italic">Submitting this report will send the entire current conversation to Milea for future improvements to our bots.</p>
                <div className="modal-action flex justify-end gap-2">
                    <form method="dialog">
                        <button className="btn">Close</button>
                    </form>
                    <button
                        className="btn btn-primary border-2"
                        type="button"
                        onClick={(e) => { handleSubmit(e) }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </dialog>
    );
}
