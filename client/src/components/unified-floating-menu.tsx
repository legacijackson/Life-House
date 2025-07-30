import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, HelpCircle } from 'lucide-react';
import { Logo } from "@/components/logo";

interface UnifiedFloatingMenuProps {
  onOpenChat: () => void;
  onOpenHelp: () => void;
}

export function UnifiedFloatingMenu({ onOpenChat, onOpenHelp }: UnifiedFloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChatClick = () => {
    setIsOpen(false);
    onOpenChat();
  };

  const handleHelpClick = () => {
    setIsOpen(false);
    onOpenHelp();
  };

  return (
    <>
      {/* Main Life House floating button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200"
        >
          {isOpen ? (
            <X className="h-7 w-7" />
          ) : (
            <Logo variant="white" layout="icon" className="h-8 w-8" />
          )}
        </Button>
      </motion.div>

      {/* Menu options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* AI Chat option */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="fixed bottom-28 right-6 z-40"
            >
              <Button
                onClick={handleChatClick}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-green-700 hover:bg-green-800 group"
                title="AI Assistant"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap"
              >
                AI Assistant
              </motion.span>
            </motion.div>

            {/* Help Desk option */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="fixed bottom-44 right-6 z-40"
            >
              <Button
                onClick={handleHelpClick}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 group"
                title="Help & Support"
              >
                <HelpCircle className="h-6 w-6" />
              </Button>
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap"
              >
                Help & Support
              </motion.span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}