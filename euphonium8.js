// Mapping of notes to fingerings
const noteFingerings = {
    24: ['1','3','4'], //C2 // TODO this only for compensating
    25: ['2','3','4'],      // TODO this only for compensating
    26: ['1','2','4'],        //TODO this only for compensating
    27: ['1','4'],          // TODO this only for compensating
    28: ['2','4'],
    29: ['4'],
    30: ['2','3'],
    31: ['1','2'],
    32: ['1'],
    33: ['2'],
    34: ['0'],
    35: ['2', '4'],
    36: ['4'],          //C3
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
    48: ['1'],          //C4
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

// low and high midi notes (inclusive) in each skill range
const ranges = {
    'novice': [34,46],
    'beginner': [32, 50],
    'intermediate': [29, 53],
    'advanced': [29,58]
};

function midiToFrequency(midiPitch) {
    const noteFrequencies = {
        0: 261.63, // C4
        1: 277.18,
        2: 293.66, // D4
        3: 311.13,
        4: 329.63, // E4
        5: 349.23, // F4
        6: 369.99,
        7: 392.00, // G4
        8: 415.30,
        9: 440.00, // A4
        10: 466.16,
        11: 493.88 // B4
    };
    const octave = Math.floor(midiPitch / 12);
    const octaveMultiple = Math.pow(2, octave - 4);
    return noteFrequencies[midiPitch % 12] * octaveMultiple; 
}

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
 * @param {string} preferAccidental - 'sharp' or 'flat'.
 * @returns [{string} noteName, {Number} octave] - The note name and octave.
 */
function midiToVexFlow(semitone, preferredAccidental='flat') {
    const lookup = {'sharp': {
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
    }, 'flat': {
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
    }};
    const octave = Math.floor(semitone / 12);
    return lookup[preferredAccidental][semitone % 12] + '/' + String(octave);
}

/**
 * Determines whether a key signature prefers sharps or flats.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'G', 'F#').
 * @returns {string} - 'sharps' or 'flats'.
 */
function getAccidentalPreference(keySignature) {
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    //const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    if (flatKeys.includes(keySignature)) {
        return 'flat';
    } else {
        return 'sharp';
    }
}

/**
 * Generates the diatonic scale for a given key signature.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'C', 'F#').
 * @returns {string} - Array of semitones in the scale
 */
function getDiatonicScale(keySignature) {
    const majorScaleIntervals = [2, 2, 1, 2, 2, 2, 1];
    const tonicSemitone = noteNameToSemitone(keySignature);
    if (tonicSemitone === null) {
        return [];
    }
    let scaleSemitones = [tonicSemitone];
    let currentSemitone = tonicSemitone;
    for (let i = 0; i < majorScaleIntervals.length - 1; i++) {
        currentSemitone = (currentSemitone + majorScaleIntervals[i]) % 12;
        scaleSemitones.push(currentSemitone);
    }
    return scaleSemitones;
}

/**
 * Produce an array of notes in the specified key signature.
 * @param {string} keySignature - The key signature (e.g., 'Bb', 'G').
 * @param {Number} beginMidi - first note
 * @param {Number} - endMidi - last note (inclusive)
 * @returns {Number[]} - Array of semitones
 */
function midiByKeySignature(keySignature, beginMidi, endMidi) {
    let scale;
    if (keySignature === 'chromatic') {
        scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    } else {
        scale = getDiatonicScale(keySignature);
        if (scale === null) {
            return [];
        }
    }
    const result = [];
    for (let note = beginMidi; note <= endMidi; note++) {
        if (scale.includes(note % 12)) {
            result.push(note);
        }
    }
    return result;
}


let keySignature = 'Bb';
let noteRange = 'intermediate';
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
        const range = ranges[noteRange];
        const possibleNotes = midiByKeySignature(keySignature, range[0], range[1] + 1);
        currentNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
        console.log(currentNote, noteFingerings[currentNote]);
        drawNote(currentNote);
        keyPressed = [];
        noteStartTime = null;
    }

    function drawNote(midiPitch) {
        
        const VF = Vex.Flow;
        const renderer = new VF.Renderer(staffCanvas, VF.Renderer.Backends.CANVAS);
        const context = renderer.getContext();
        context.clearRect(0, 0, staffCanvas.width, staffCanvas.height);
        const stave = new VF.Stave(10, 40, 500);
        stave.addClef('bass').addKeySignature(keySignature === 'chromatic' ? 'C' : keySignature);
        stave.setContext(context).draw();
        const vfkey = midiToVexFlow(midiPitch, getAccidentalPreference(keySignature));
        const note = new VF.StaveNote({ clef: 'bass', keys: [vfkey], duration: 'q' });
        if (keySignature === 'chromatic') {
            if (vfkey.includes('#')) {
                note.addModifier(new VF.Accidental('#'));
            } else if (vfkey.includes('b')) {
                note.addModifier(new VF.Accidental('b'));
            }
        }

        const voice = new VF.Voice({ num_beats: 1, beat_value: 4 });
        voice.addTickable(note);

        const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);
        voice.draw(context, stave);
    }

    function convertToVexflowKey(noteName, octave) {
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
        const correctFingering = noteFingerings[currentNote];
        keyPressed.sort();
        correctFingering.sort();

        const isCorrect = arraysEqual(keyPressed, correctFingering);

        if (isCorrect) {
            score++;
            scoreDisplay.textContent = 'Score: ' + score;
            playNoteSound(currentNote);
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

    function playNoteSound(midiPitch) {
        if (oscillator) {
            oscillator.stop();
        }

        context = new (window.AudioContext || window.webkitAudioContext)();
        oscillator = context.createOscillator();
        oscillator.type = 'sine';
        const freq = midiToFrequency(midiPitch);
        console.log(midiPitch, freq);
        oscillator.frequency.setValueAtTime(freq, context.currentTime);
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
        const vfkey = midiToVexFlow(currentNote, getAccidentalPreference(keySignature));
        messageDisplay.textContent = vfkey + ' fingering is ' + noteFingerings[currentNote].join('-');
        setTimeout(() => {
            messageDisplay.textContent = '';
        }, 3000);
    }
});

