export function ChatStyles() {
  return (
    <style>{`
      @keyframes chatMsgIn { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes chatSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes chatSlideIn { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes chatPop { 0% { transform: scale(.5); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
      @keyframes chatDot { 0%, 60%, 100% { transform: translateY(0); opacity: .35; } 30% { transform: translateY(-5px); opacity: 1; } }
      @keyframes chatShimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
      @keyframes chatRing { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.55); } 100% { box-shadow: 0 0 0 7px rgba(34,197,94,0); } }
      @keyframes chatBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

      .chat-msg-in { animation: chatMsgIn .28s cubic-bezier(.2,.8,.2,1) both; }
      .chat-slide-up { animation: chatSlideUp .3s ease-out both; }
      .chat-slide-in { animation: chatSlideIn .28s ease-out both; }
      .chat-pop { animation: chatPop .3s ease-out both; }
      .chat-dot { animation: chatDot 1.2s infinite ease-in-out; }
      .chat-presence { animation: chatRing 1.8s infinite; }
      .chat-bob { animation: chatBob 3s infinite ease-in-out; }
      .chat-skeleton {
        background: linear-gradient(90deg, #F0F0F0 25%, #E6E6E6 37%, #F0F0F0 63%);
        background-size: 600px 100%;
        animation: chatShimmer 1.3s infinite linear;
      }
      .chat-scroll::-webkit-scrollbar { width: 6px; }
      .chat-scroll::-webkit-scrollbar-thumb { background: #D9D9D9; border-radius: 9999px; }
      .chat-scroll { scrollbar-width: thin; scrollbar-color: #D9D9D9 transparent; }

      @media (min-width: 768px) { .chat-slide-in { animation: none; } }
      @media (prefers-reduced-motion: reduce) {
        .chat-msg-in, .chat-slide-up, .chat-slide-in, .chat-pop, .chat-dot, .chat-presence, .chat-bob, .chat-skeleton { animation: none !important; }
      }
    `}</style>
  );
}