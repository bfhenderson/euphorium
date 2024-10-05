// Mapping of notes to fingerings
const noteFingerings = {
    // Low range F2 to Bb2
    29: ['4'],
    30: ['2','3'],
    31: ['1','2'],
    32: ['1'],
    33: ['2'],
    34: ['0'],
    35: ['2', '4'],

    // Middle range C3 to Bb3
    36: ['4'],
    37: ['2','3'],
    38: ['1','2'],
    39: ['1'],
    40: ['2'],
    41: ['0'],
    42: ['2','3'],
    43: ['1','2'],
    44: ['1'],
    45: ['2'],
    46: ['0'],
    47: ['1','2'],

    // High range C4 to Bb4
    48: ['1'],
    49: ['2'],
    50: ['0'],
    51: ['1'],
    52: ['2'],
    53: ['0'],
    54: ['2', '3'],
    55: ['1','2'],
    56: ['1'],
    57: ['2'],
    58: ['0']
};

// List of possible notes in each range
const ranges = {
    'low': ['F2','F#2','G2','G#2','A2','Bb2','B2'],
    'mid': ['C3','C#3','D3','Eb3','E3','F3','F#3','G3','G#3','A3','Bb3'],
    'high': ['C4','C#4','D4','Eb4','E4','F4','F#4','G4','G#4','A4','Bb4'],
    'full': ['F2','F#2','G2','G#2','A2','Bb2','B2','C3','C#3','D3','Eb3','E3','F3','F#3','G3','G#3','A3','Bb3','C4','C#4','D4','Eb4','E4','F4','F#4','G4','G#4','A4','Bb4']
};

// Mapping of note names to frequencies (in Hz)
const noteFrequencies = {
    29: 87.31,          // F2
    30: 92.50,
    31: 98.00,
    32: 103.83,
    33: 110.00,
    34: 116.54,
    35: 123.47,
    36: 130.81,         // C3
    37: 138.59,
    38: 146.83,
    39: 155.56,
    40: 164.81,
    41: 174.61,
    42: 185.00,
    43: 196.00,
    44: 207.65,
    45: 220.00,
    46: 233.08,
    47: 246.94,
    48: 261.63,         // C4
    49: 277.18,
    50: 293.66,
    51: 311.13,
    52: 329.63,
    53: 349.23,
    54: 369.99,
    55: 392.00,
    56: 415.30,
    57: 440.00,
    58: 466.16
};

const noteSemitoneMap = {
    'C': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11
};

// (0-96ish) based on note name and octave, or null if an invalid note.
/**
 * Converts a note to its corresponding midi pitch.
 * @param {string} note - The note name (e.g., 'C#4', 'Eb2', 'F3').
 * @returns {number|null} - Semitone number (0-96ish) 
 * */
function noteToMidi(note) {
    const match = note.match(/^([A-G][#b]?)([0-8]{1})/);
    if (match === null) {
        return null;
    }
    const semitone = noteSemitoneMap[match[1]];
    if (semitone === undefined) {
        return null;
    }
    // octave
    return semitone + Number(match[2]) * 12;
}

/**
 * Converts a note name to its corresponding semitone number.
 * @param {string} noteName - The note name (e.g., 'C#', 'Eb', 'F').
 * @returns {number|null} - Semitone number (0-11) 
 * */
function noteNameToSemitone(noteName) {
    const semitone = noteSemitoneMap[noteName];
    if (semitone === undefined) {
        return null;
    }
    return semitone;
}

/**
 * Converts a semitone number to its corresponding note name, preferring sharps or flats.
 * @param {number} semitone - Semitone number (0-11).
 * @param {string} preferAccidental - 'sharps' or 'flats'.
 * @returns {string} - The note name.
 */
function semitoneToNoteName(semitone, preferAccidental) {
    const semitoneToNoteNameSharps = {
        0: 'C',
        1: 'C#',
        2: 'D',
        3: 'D#',
        4: 'E',
        5: 'F',
        6: 'F#',
        7: 'G',
        8: 'G#',
        9: 'A',
        10: 'A#',
        11: 'B'
    };
    const semitoneToNoteNameFlats = {
        0: 'C',
        1: 'Db',
        2: 'D',
        3: 'Eb',
        4: 'E',
        5: 'F',
        6: 'Gb',
        7: 'G',
        8: 'Ab',
        9: 'A',
        10: 'Bb',
        11: 'B'
    };
    semitone = ((semitone % 12) + 12) % 12; // Ensure semitone is between 0 and 11
    if (preferAccidental === 'sharps') {
        return semitoneToNoteNameSharps[semitone];
    } else if (preferAccidental === 'flats') {
        return semitoneToNoteNameFlats[semitone];
    } else {
        return semitoneToNoteNameSharps[semitone]; // Default to sharps
    }
}

/**
 * Determines whether a key signature prefers sharps or flats.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'G', 'F#').
 * @returns {string} - 'sharps' or 'flats'.
 */
function getAccidentalPreference(keySignature) {
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    if (flatKeys.includes(keySignature)) {
        return 'flats';
    } else if (sharpKeys.includes(keySignature)) {
        return 'sharps';
    } else {
        return 'sharps'; // Default to sharps for 'C' major
    }
}

/**
 * Normalizes a note name to a canonical form, handling enharmonic equivalents.
 * @param {string} noteName - The note name to normalize (e.g., 'A#', 'Bb').
 * @param {string} preferAccidental - 'sharps' or 'flats'.
 * @returns {string|null} - Normalized note name or null if invalid.
 */
function normalizeNoteName(noteName, preferAccidental) {
    const semitone = noteNameToSemitone(noteName);
    if (semitone === null) {
        return null;
    }
    return semitoneToNoteName(semitone, preferAccidental);
}

/**
 * Generates the diatonic scale for a given key signature.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'C', 'F#').
 * @returns {string[]|null} - Array of note names in the scale or null if invalid key.
 */
function getDiatonicScale(keySignature) {
    const majorScaleIntervals = [2, 2, 1, 2, 2, 2, 1];
    const preferAccidental = getAccidentalPreference(keySignature);
    const tonicSemitone = noteNameToSemitone(keySignature);
    if (tonicSemitone === null) {
        return null;
    }
    let scaleSemitones = [tonicSemitone];
    let currentSemitone = tonicSemitone;
    for (let i = 0; i < majorScaleIntervals.length - 1; i++) {
        currentSemitone = (currentSemitone + majorScaleIntervals[i]) % 12;
        scaleSemitones.push(currentSemitone);
    }
    // Map semitone numbers to note names
    const diatonicScale = scaleSemitones.map(semitone =>
        semitoneToNoteName(semitone, preferAccidental)
    );
    return diatonicScale;
}

/**
 * Filters an array of notes, returning only those in the specified key signature.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'G').
 * @param {string[]} notesArray - Array of note names with octaves (e.g., ['F2', 'G#3']).
 * @returns {string[]} - Array of notes that are in the key signature.
 */
function filterNotesByKeySignature(keySignature, notesArray) {
    const diatonicScale = getDiatonicScale(keySignature);
    if (diatonicScale === null) {
        return [];
    }
    const preferAccidental = getAccidentalPreference(keySignature);
    const result = [];
    for (const noteWithOctave of notesArray) {
        // Extract note name and octave
        const match = noteWithOctave.match(/^([A-G][#b]?)(\d*)$/);
        if (!match) {
            continue; // Invalid note format
        }
        const noteName = match[1];
        const octave = match[2];
        const normalizedNoteName = normalizeNoteName(noteName, preferAccidental);
        if (diatonicScale.includes(normalizedNoteName)) {
            result.push(`${normalizedNoteName}${octave}`);
        }
    }
    return result;
}


let keySignature = 'C';
let noteRange = 'full';
let currentNote = null;
let timer = 60;
let score = 0;
let highScore = 0;
let timeInterval = null;
let keyPressed = [];
let noteStartTime = null;
let context = null;
let oscillator = null;

document.addEventListener('DOMContentLoaded', () => {
    const keySignatureSelect = document.getElementById('keySignature');
    const noteRangeSelect = document.getElementById('noteRange');
    const startButton = document.getElementById('startButton');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const messageDisplay = document.getElementById('message');
    const staffCanvas = document.getElementById('staff');
    const gameDiv = document.getElementById('game');

    startButton.addEventListener('click', () => {
        keySignature = keySignatureSelect.value;
        noteRange = noteRangeSelect.value;
        score = 0;
        timer = 60;
        scoreDisplay.textContent = 'Score: ' + score;
        messageDisplay.textContent = '';
        startButton.textContent = 'Restart';
        gameDiv.style.display = 'block';
        startGame();
    });

    function startGame() {
        // Load high score from local storage
        highScore = localStorage.getItem('euphoniumHighScore') || 0;

        // Start timer
        if (timeInterval) {
            clearInterval(timeInterval);
        }
        timeInterval = setInterval(() => {
            timer--;
            timerDisplay.textContent = 'Time: ' + timer;
            if (timer <= 0) {
                endGame();
            }
        }, 1000);

        // Start listening for key presses
        document.addEventListener('keydown', onKeyDown);

        // Generate the first note
        generateNewNote();
    }

    function endGame() {
        clearInterval(timeInterval);
        document.removeEventListener('keydown', onKeyDown);
        playTriumphantSound();
        if (score > highScore) {
            localStorage.setItem('euphoniumHighScore', score);
            highScore = score;
            messageDisplay.textContent = `Time's up! New high score: ${score}!`;
        } else {
            messageDisplay.textContent = `Time's up! Your score: ${score}. High score: ${highScore}.`;
        }
    }

    function generateNewNote() {
        const chromaticPossibilities = ranges[noteRange];
        const possibleNotes = filterNotesByKeySignature(keySignature, chromaticPossibilities);
        currentNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
        //console.log(currentNote, noteFingerings[currentNote]);
        drawNote();
        keyPressed = [];
        noteStartTime = null;
    }

    function drawNote() {
        const VF = Vex.Flow;
        const renderer = new VF.Renderer(staffCanvas, VF.Renderer.Backends.CANVAS);
        const context = renderer.getContext();
        context.clearRect(0, 0, staffCanvas.width, staffCanvas.height);
        const stave = new VF.Stave(10, 40, 500);
        stave.addClef('bass').addKeySignature(keySignature);
        stave.setContext(context).draw();
        const vfkey = convertToVexflowKey(currentNote);
        const note = new VF.StaveNote({ clef: 'bass', keys: [vfkey], duration: 'q' });
        // we need to add this back if we support accidentals inside the scale, or for the chromatic scale but for 
        // these normal scales this is redundant to the key signature
        if (currentNote.includes('#')) {
            note.addModifier(new VF.Accidental('#'));
        } else if (currentNote.includes('b')) {
            note.addModifier(new VF.Accidental('b'));
        }

        const voice = new VF.Voice({ num_beats: 1, beat_value: 4 });
        voice.addTickable(note);

        const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
        voice.draw(context, stave);
    }

    function convertToVexflowKey(note) {
        let octave = note.slice(-1);
        let pitch = note.slice(0, -1);
        //pitch = pitch.replace('b', '/flat').replace('#', '/sharp');
        return pitch + '/' + octave;
    }

    function onKeyDown(event) {
        const startLength = keyPressed.length;
        const key = event.key.toLowerCase();
        if (key === 'j' && !keyPressed.includes('1')) {
            keyPressed.push('1');
        } else if (key === 'k' && !keyPressed.includes('2')) {
            keyPressed.push('2');
        } else if (key === 'l' && !keyPressed.includes('3')) {
            keyPressed.push('3');
        } else if (key === ';' && !keyPressed.includes('4')) {
            keyPressed.push('4');
        } else if (key === ' ' && !keyPressed.includes('0')) {
            keyPressed.push('0');
            event.preventDefault();
        }

        if (startLength === 0 && keyPressed.length > 0 && noteStartTime === null) {
            noteStartTime = Date.now();
            setTimeout(evaluateAnswer, 250);
        }
    }

    function evaluateAnswer() {
        let midiNum = noteToMidi(currentNote);
        const correctFingering = noteFingerings[midiNum];
        keyPressed.sort();
        correctFingering.sort();

        const isCorrect = arraysEqual(keyPressed, correctFingering);

        if (isCorrect) {
            score++;
            scoreDisplay.textContent = 'Score: ' + score;
            playNoteSound(midiNum);
            setTimeout(generateNewNote, 500);
        } else {
            playErrorSound();
            showCorrectFingering();
            setTimeout(generateNewNote, 2000);
        }
    }

    function arraysEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    function playNoteSound(midiNum) {
        if (oscillator) {
            oscillator.stop();
        }

        context = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(noteFrequencies[midiNum], context.currentTime);
        oscillator.connect(context.destination);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, 500);
    }

    function playErrorSound() {
        if (oscillator) {
            oscillator.stop();
        }

        context = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = context.createOscillator();
        const lfo = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, context.currentTime);
        lfo.frequency.setValueAtTime(5, context.currentTime);
        lfo.connect(gainNode.gain);
        oscillator.connect(gainNode).connect(context.destination);
        oscillator.start();
        lfo.start();

        setTimeout(() => {
            oscillator.stop();
            lfo.stop();
        }, 1000);
    }

    function playTriumphantSound() {
        if (oscillator) {
            oscillator.stop();
        }

        context = new (window.AudioContext || window.webkitAudioContext)();
        const now = context.currentTime;

        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        frequencies.forEach((freq, index) => {
            const osc = context.createOscillator();
            osc.frequency.setValueAtTime(freq, now + index * 0.2);
            osc.connect(context.destination);
            osc.start(now + index * 0.2);
            osc.stop(now + index * 0.2 + 0.2);
        });
    }

    function showCorrectFingering() {
        messageDisplay.textContent = currentNote + ' fingering: ' + noteFingerings[noteToMidi(currentNote)].join('-');
        setTimeout(() => {
            messageDisplay.textContent = '';
        }, 3000);
    }
});

