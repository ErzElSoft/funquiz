# Firebase Realtime Database Migration Guide

## Current Status

### ✅ Completed
1. **Firebase SDK Installed** - `npm install firebase` (v11+)
2. **Firebase Configuration** - `services/firebase.ts` configured with your project credentials
3. **Game Service Created** - `services/gameService.ts` with helper functions for Firebase operations
4. **Footer Component** - Reusable footer added to all pages

### Firebase Project Details
- **Project Name**: erzel-quiz
- **Database URL**: https://erzel-quiz-default-rtdb.firebaseio.com
- **Region**: US Central
- **Security Rules**: Currently in TEST MODE (open access)

---

## What Needs to Be Done

### 1. Update HostPanel.tsx
**Current**: Uses `BroadcastChannel` for local communication
**Target**: Use Firebase Realtime Database for cross-device communication

#### Key Changes Needed:

**A. Replace BroadcastChannel initialization:**
```typescript
// OLD (lines ~27-35)
useEffect(() => {
  const bc = new BroadcastChannel(CHANNEL_NAME);
  bc.onmessage = (event) => {
    handleMessage(event.data);
  };
  setChannel(bc);
  return () => bc.close();
}, []);

// NEW
useEffect(() => {
  if (pin && gameState === GameState.LOBBY) {
    const unsubscribePlayers = listenToPlayers(pin, (playersList) => {
      setPlayers(playersList);
    });
    
    return () => {
      unsubscribePlayers();
    };
  }
}, [pin, gameState]);
```

**B. Replace handleMessage function:**
```typescript
// OLD (lines ~73-91)
const handleMessage = (msg: ChannelMessage) => {
  if (msg.type === 'PLAYER_JOIN') {
    const { name, pin: joinedPin, id, avatar } = msg.payload;
    setPin(currentPin => {
      if (joinedPin === currentPin) {
        setPlayers(prev => {
          if (prev.find(p => p.id === id)) return prev;
          return [...prev, { id, name, score: 0, streak: 0, avatar }];
        });
      }
      return currentPin;
    });
  } else if (msg.type === 'PLAYER_ANSWER') {
    const { playerId, answerIndex, answerText } = msg.payload;
    setCurrentAnswers(prev => ({ 
      ...prev, 
      [playerId]: { index: answerIndex, text: answerText } 
    }));
  }
};

// NEW - Remove this function entirely, use Firebase listeners instead
```

**C. Replace broadcastState function:**
```typescript
// OLD (lines ~38-70)
const broadcastState = useCallback((overrideState?: Partial<HostStatePayload>) => {
  if (!channel) return;
  // ... broadcast logic
  channel.postMessage({
    type: 'HOST_STATE_UPDATE',
    payload: payload
  });
}, [channel, gameState, quiz, currentQuestionIndex, players, timeLeft]);

// NEW
const broadcastState = useCallback(async (overrideState?: Partial<HostStatePayload>) => {
  if (!pin) return;
  
  const currentQ = quiz?.questions[currentQuestionIndex];
  const resultInfo = gameState === GameState.REVEAL && currentQ 
    ? { 
        correctIndex: currentQ.correctIndex, 
        correctText: currentQ.correctIndex === -1 ? currentQ.options[0] : undefined 
      } 
    : undefined;

  const payload: HostStatePayload = {
    pin,
    gameState: overrideState?.gameState ?? gameState,
    currentQuestion: gameState === GameState.QUESTION ? currentQ : undefined,
    timeLeft: gameState === GameState.QUESTION ? timeLeft : undefined,
    players: gameState === GameState.LOBBY ? players : undefined,
    resultInfo,
    ...overrideState
  };

  await updateHostState(pin, payload);
}, [pin, gameState, quiz, currentQuestionIndex, players, timeLeft]);
```

**D. Update startGame function:**
```typescript
// Add at the beginning of startGame:
const startGame = async () => {
  if (!quiz || players.length === 0) return;
  
  // Generate PIN and create game in Firebase
  const newPin = Math.floor(100000 + Math.random() * 900000).toString();
  setPin(newPin);
  await createGame(newPin);
  
  // Rest of the function...
  setGameState(GameState.LOBBY);
  setCurrentQuestionIndex(0);
  broadcastState({ gameState: GameState.LOBBY });
  
  // Listen to answers
  const unsubscribeAnswers = listenToAnswers(newPin, (answers) => {
    setCurrentAnswers(answers);
  });
  
  // Store unsubscribe function for cleanup
};
```

**E. Listen to answers during questions:**
```typescript
// Add new useEffect for answer listening
useEffect(() => {
  if (pin && gameState === GameState.QUESTION) {
    const unsubscribe = listenToAnswers(pin, (answers) => {
      setCurrentAnswers(answers);
    });
    
    return () => {
      unsubscribe();
    };
  }
}, [pin, gameState]);
```

**F. Clear answers when moving to next question:**
```typescript
// In nextQuestion function, add:
const nextQuestion = async () => {
  if (!quiz) return;
  
  await clearAnswers(pin); // Clear Firebase answers
  setCurrentAnswers({});
  
  // Rest of the function...
};
```

---

### 2. Update PlayerPanel.tsx
**Current**: Uses `BroadcastChannel` for local communication
**Target**: Use Firebase Realtime Database

#### Key Changes Needed:

**A. Replace BroadcastChannel initialization:**
```typescript
// OLD (lines ~40-52)
useEffect(() => {
  const bc = new BroadcastChannel(CHANNEL_NAME);
  bc.onmessage = (event) => {
    const msg = event.data as ChannelMessage;
    if (msg.type === 'HOST_STATE_UPDATE') {
      const payload = msg.payload;
      setHostState(prev => {
        // ... state update logic
      });
    }
  };
  setChannel(bc);
  return () => bc.close();
}, []);

// NEW
useEffect(() => {
  if (joined && pin) {
    const unsubscribe = listenToHostState(pin, (state) => {
      setHostState(prev => {
        if (prev?.gameState !== GameState.QUESTION && state?.gameState === GameState.QUESTION) {
          setHasAnswered(false);
          setLastResult(null);
          setTextAnswer('');
          setMySelectedAnswerIdx(null);
        }
        return state;
      });
    });
    
    return () => {
      unsubscribe();
    };
  }
}, [joined, pin]);
```

**B. Update joinGame function:**
```typescript
// OLD (lines ~83-92)
const joinGame = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !pin || !channel) return;
  channel.postMessage({
    type: 'PLAYER_JOIN',
    payload: { name, pin, id: playerId, avatar: AVATARS[selectedAvatar].emoji }
  });
  setJoined(true);
};

// NEW
const joinGame = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !pin) return;
  
  // Check if game exists
  const gameExists = await checkGameExists(pin);
  if (!gameExists) {
    alert('Game not found! Please check the PIN.');
    return;
  }
  
  // Join the game
  const avatarData = customPhoto || AVATARS[selectedAvatar].emoji;
  await joinGame(pin, {
    id: playerId,
    name,
    score: 0,
    streak: 0,
    avatar: avatarData
  });
  
  setJoined(true);
};
```

**C. Update submitAnswer function:**
```typescript
// OLD (lines ~94-102)
const submitAnswer = (index: number) => {
  if (!channel || !hostState || hasAnswered) return;
  channel.postMessage({
    type: 'PLAYER_ANSWER',
    payload: { playerId, answerIndex: index, timeRemaining: 0 }
  });
  setMySelectedAnswerIdx(index);
  setHasAnswered(true);
};

// NEW
const submitAnswer = async (index: number) => {
  if (!pin || !hostState || hasAnswered) return;
  
  await submitAnswer(pin, playerId, {
    answerIndex: index,
    timeRemaining: 0
  });
  
  setMySelectedAnswerIdx(index);
  setHasAnswered(true);
};
```

**D. Update submitTextAnswer function:**
```typescript
// OLD (lines ~104-112)
const submitTextAnswer = (e: React.FormEvent) => {
  e.preventDefault();
  if (!channel || !hostState || hasAnswered || !textAnswer.trim()) return;
  channel.postMessage({
    type: 'PLAYER_ANSWER',
    payload: { playerId, answerText: textAnswer.trim(), timeRemaining: 0 }
  });
  setHasAnswered(true);
};

// NEW
const submitTextAnswer = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!pin || !hostState || hasAnswered || !textAnswer.trim()) return;
  
  await submitAnswer(pin, playerId, {
    answerText: textAnswer.trim(),
    timeRemaining: 0
  });
  
  setHasAnswered(true);
};
```

---

### 3. Remove Unused Code

**A. Remove from types.ts:**
```typescript
// DELETE this type (no longer needed):
export type ChannelMessage = 
  | { type: 'HOST_STATE_UPDATE'; payload: HostStatePayload }
  | { type: 'PLAYER_JOIN'; payload: { name: string; pin: string; id: string; avatar?: string } }
  | { type: 'PLAYER_ANSWER'; payload: { playerId: string; answerIndex?: number; answerText?: string; timeRemaining: number } };
```

**B. Remove BroadcastChannel state:**
```typescript
// DELETE from both HostPanel and PlayerPanel:
const [channel, setChannel] = useState<BroadcastChannel | null>(null);
```

---

### 4. Update Firebase Security Rules

**Current**: Test mode (anyone can read/write)
**Production**: Secure rules needed

Go to Firebase Console > Realtime Database > Rules and update:

```json
{
  "rules": {
    "games": {
      "$gamePin": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".write": true
          }
        },
        "answers": {
          "$playerId": {
            ".write": true
          }
        },
        "hostState": {
          ".write": true
        }
      }
    }
  }
}
```

---

### 5. Testing Checklist

After implementing changes:

- [ ] Host can create a game and get a PIN
- [ ] Player can join from different device using PIN
- [ ] Player appears in lobby on host screen
- [ ] Host can start the game
- [ ] Questions appear on both host and player screens
- [ ] Player can submit answers
- [ ] Host sees answer count update in real-time
- [ ] Results show correctly after each question
- [ ] Leaderboard updates properly
- [ ] Game completes and shows final results
- [ ] Footer appears on all screens
- [ ] Background image loads correctly
- [ ] Logo displays in footer

---

### 6. Import Statements to Add

**HostPanel.tsx:**
```typescript
import { createGame, updateHostState, listenToPlayers, listenToAnswers, clearAnswers } from '../services/gameService';
```

**PlayerPanel.tsx:**
```typescript
import { joinGame, listenToHostState, submitAnswer, checkGameExists } from '../services/gameService';
```

---

### 7. Known Issues to Fix

1. **Import naming conflict**: `submitAnswer` function name conflicts with import
   - Solution: Rename local function or use alias: `import { submitAnswer as firebaseSubmitAnswer }`

2. **Cleanup on unmount**: Need to unsubscribe from Firebase listeners
   - Solution: Store unsubscribe functions and call in cleanup

3. **PIN generation**: Currently generates random PIN
   - Consider: Check if PIN already exists before using

4. **Game cleanup**: Old games stay in database
   - Solution: Add TTL or cleanup function to delete old games

---

### 8. Deployment Notes

After completing Firebase migration:

1. Rebuild production: `npm run build`
2. Copy to production folder
3. Upload to server
4. Test cross-device functionality
5. Update Firebase security rules for production

---

### 9. Estimated Time

- HostPanel refactor: 1-1.5 hours
- PlayerPanel refactor: 1-1.5 hours  
- Testing & debugging: 1 hour
- **Total: 3-4 hours**

---

### 10. Next Steps

1. Start with HostPanel.tsx - implement Firebase listeners
2. Test host functionality locally
3. Move to PlayerPanel.tsx - implement Firebase listeners
4. Test cross-device with phone + computer
5. Fix any bugs found during testing
6. Update security rules
7. Deploy to production

---

## Quick Reference

### Firebase Service Functions

```typescript
// Game management
createGame(pin: string)
deleteGame(pin: string)
checkGameExists(pin: string): Promise<boolean>

// Host operations
updateHostState(pin: string, hostState: HostStatePayload)
listenToPlayers(pin: string, callback: (players: Player[]) => void)
listenToAnswers(pin: string, callback: (answers: Record<string, any>) => void)
clearAnswers(pin: string)

// Player operations
joinGame(pin: string, player: Player)
listenToHostState(pin: string, callback: (hostState: HostStatePayload | null) => void)
submitAnswer(pin: string, playerId: string, answer: {...})
```

---

## Contact & Support

If you encounter issues during migration:
1. Check Firebase Console for database activity
2. Use browser DevTools Console for errors
3. Verify Firebase rules allow read/write
4. Test with simple console.log statements

---

**Document Created**: December 3, 2025
**Last Updated**: December 3, 2025
**Status**: Ready for implementation
