import sys
import time
import random
import numpy as np
import pygame
import sounddevice as sd

# Initialize Pygame for the display
pygame.init()

# Set up the window
window_width = 800
window_height = 600
window = pygame.display.set_mode((window_width, window_height))
pygame.display.set_caption('Euphonium Fingering Practice')

# Define colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Define fonts
font = pygame.font.SysFont('Arial', 24)

# Define key mapping
key_mapping = {
    pygame.K_SPACE: 'open',
    pygame.K_j: '1',
    pygame.K_k: '2',
    pygame.K_l: '3',
    pygame.K_SEMICOLON: '4',
}

# Define the Note class
class Note:
    def __init__(self, name, position_index, fingering, frequency):
        self.name = name
        self.position_index = position_index  # For vertical position on staff
        self.fingering = fingering  # List of keys required
        self.frequency = frequency  # Frequency of the note

# Define staff parameters
line_spacing = 20
staff_top = 200
staff_bottom = staff_top + 4 * line_spacing  # 5 lines, so 4 spaces

def draw_staff(surface):
    for i in range(5):
        y = staff_top + i * line_spacing
        pygame.draw.line(surface, BLACK, (100, y), (700, y), 2)

def get_note_y(position_index):
    staff_middle_line_y = staff_top + 2 * line_spacing  # Line 3 (middle line)
    y = staff_middle_line_y - position_index * (line_spacing / 2)
    return y

def draw_note(surface, position_index):
    x = 400  # Center of the staff
    y = get_note_y(position_index)
    pygame.draw.ellipse(surface, BLACK, (x - 10, y - 5, 20, 10), 2)
    # Draw ledger lines if necessary
    if position_index < -4 or position_index > 4:
        num_ledger_lines = (abs(position_index) - 4) // 2 + 1
        for i in range(num_ledger_lines):
            if position_index < -4:
                ledger_y = staff_bottom + (i + 1) * line_spacing
            else:
                ledger_y = staff_top - (i + 1) * line_spacing
            pygame.draw.line(surface, BLACK, (x - 20, ledger_y), (x + 20, ledger_y), 2)

# Function to generate a sine wave sound array
def generate_sine_wave(frequency, duration, volume=0.5, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    wave = np.sin(frequency * t * 2 * np.pi)
    audio = wave * volume
    return audio

# Function to generate a raspberry sound (noise)
def generate_noise(duration, volume=0.5, sample_rate=44100):
    samples = np.random.uniform(-1, 1, int(sample_rate * duration))
    audio = samples * volume
    return audio

# Function to generate a modulated sawtooth wave for incorrect sound
def generate_modulated_sawtooth_wave(carrier_freq, mod_freq, duration, volume=0.5, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Sawtooth wave
    wave = 2 * (t * carrier_freq - np.floor(0.5 + t * carrier_freq))
    # Low-frequency oscillator (LFO)
    lfo = 0.5 * np.sin(2 * np.pi * mod_freq * t)
    # Modulate the amplitude of the sawtooth wave
    modulated_wave = wave * (1 + lfo) * volume
    # Ensure the values are within [-1, 1]
    modulated_wave = np.clip(modulated_wave, -1, 1)
    return modulated_wave


# Pre-generate note sounds
note_sounds = {}
sample_rate = 44100  # Samples per second
note_duration = 0.5  # In seconds
for note_name, freq in [
    ('Bb2', 116.54),
    ('C3', 130.81),
    ('D3', 146.83),
    ('E3', 164.81),
    ('F3', 174.61),
    ('G3', 196.00),
    ('A3', 220.00),
    ('Bb3', 233.08),
    ('C4', 261.63),
    ('D4', 293.66),
    ('Eb4', 329.63),
    ('F4', 349.23),
    ('G4', 392.00),
    ('A4', 440.00),
    ('Bb4', 466.16),
    ('C5', 523.25),
]:
    audio_data = generate_sine_wave(freq, note_duration)
    note_sounds[note_name] = audio_data

# Generate raspberry sound
raspberry_data = generate_modulated_sawtooth_wave(
    carrier_freq=200,    # Carrier frequency in Hz
    mod_freq=5,          # Modulation frequency in Hz
    duration=0.5,
    volume=0.5,
    sample_rate=sample_rate
)

# Create a list of notes
'''
Note('Bb2', -9, ['J'], 116.54),    # Valve 1
Note('C3', -7, ['O'], 130.81),     # Open
Note('D3', -6, ['J', 'K'], 146.83),# Valves 1 and 2
Note('E3', -5, ['K'], 164.81),     # Valve 2
Note('F3', -4, ['O'], 174.61),     # Open
Note('G3', -3, ['J', 'K'], 196.00),# Valves 1 and 2
Note('A3', -2, ['K'], 220.00),     # Valve 2

Note('A4', 4, ['K'], 440.00),      # Valves 2
Note('Bb4', 5, ['O'], 466.16),     # Open
Note('C5', 6, ['J'], 523.25),      # Valve 1
'''

notes = [
    Note('Bb3', -2, ['open'], 233.08),    # Open
    Note('C4', -1, ['4'], 261.63), # Valve 4
    Note('D4', 0, ['1', '2'], 293.66), # Valves 1 and 2
    Note('Eb4', 1, ['1'], 329.63),      # Valve 2
    Note('F4', 2, ['open'], 349.23),      # Open
    Note('G4', 3, ['1', '2'], 392.00), # Valves 1 and 2
]

# Initialize variables
running = True
game_started = False
game_over = False
waiting_for_input = False
showing_correct_fingering = False
input_keys = []
first_key_time = None
input_window = 0.25
timer_start = None
timer_duration = 60
current_note = None
score = 0
correct_fingering_start_time = None

clock = pygame.time.Clock()

while running:
    window.fill(WHITE)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            pygame.quit()
            sys.exit()
        elif event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            if not game_started:
                if game_over:
                    if play_again_button_rect.collidepoint(mouse_pos):
                        # Reset game variables
                        game_started = True
                        game_over = False
                        timer_start = time.time()
                        current_note = random.choice(notes)
                        waiting_for_input = True
                        input_keys = []
                        first_key_time = None
                        score = 0
                else:
                    if start_button_rect.collidepoint(mouse_pos):
                        game_started = True
                        timer_start = time.time()
                        current_note = random.choice(notes)
                        waiting_for_input = True
                        input_keys = []
                        first_key_time = None
        elif event.type == pygame.KEYDOWN:
            if game_started and waiting_for_input and not showing_correct_fingering:
                if event.key in key_mapping:
                    key_name = key_mapping[event.key]
                    if first_key_time is None:
                        first_key_time = time.time()
                    input_keys.append(key_name)
    # Game logic here
    if game_started:
        # Update timer
        elapsed_time = time.time() - timer_start
        time_left = timer_duration - elapsed_time
        if time_left <= 0:
            # Time is up
            game_started = False
            game_over = True
        else:
            # Display timer
            timer_text = font.render(f"Time: {int(time_left)}", True, BLACK)
            window.blit(timer_text, (10, 10))
            # Display score
            score_text = font.render(f"Score: {score}", True, BLACK)
            window.blit(score_text, (10, 40))
            # Display current note
            draw_staff(window)
            draw_note(window, current_note.position_index)
            # Handle input timing
            if showing_correct_fingering:
                if time.time() - correct_fingering_start_time >= 2:
                    # 2 seconds have passed
                    showing_correct_fingering = False
                    waiting_for_input = True
                    current_note = random.choice(notes)
                else:
                    # Display the correct fingering
                    fingering_text = font.render(f"{current_note.name} Correct Fingering: {' + '.join(current_note.fingering)}", True, BLACK)
                    window.blit(fingering_text, (100, 400))
            elif first_key_time is not None and time.time() - first_key_time >= input_window:
                # Input window has passed
                if set(input_keys) == set(current_note.fingering):
                    # Correct
                    audio_data = note_sounds[current_note.name]
                    sd.play(audio_data, sample_rate)
                    #sd.wait()  # Wait until sound is finished
                    score += 1
                    # Get new note
                    current_note = random.choice(notes)
                    # Reset input variables
                    waiting_for_input = True
                    input_keys = []
                    first_key_time = None
                else:
                    # Incorrect
                    sd.play(raspberry_data, sample_rate)
                    #sd.wait()  # Wait until sound is finished
                    # Show correct fingering for 2 seconds
                    showing_correct_fingering = True
                    correct_fingering_start_time = time.time()
                    # Reset input variables
                    waiting_for_input = False
                    input_keys = []
                    first_key_time = None
    else:
        if game_over:
            # Display the score
            score_text = font.render(f"Your Score: {score}", True, BLACK)
            window.blit(score_text, (350, 250))
            # Display "Play Again" button
            play_again_button_rect = pygame.Rect(350, 300, 100, 50)
            pygame.draw.rect(window, BLACK, play_again_button_rect)
            play_again_text = font.render("Play Again", True, WHITE)
            window.blit(play_again_text, (play_again_button_rect.x + 5, play_again_button_rect.y + 10))
        else:
            # Display start button
            start_button_rect = pygame.Rect(350, 500, 100, 50)
            pygame.draw.rect(window, BLACK, start_button_rect)
            start_text = font.render("Start", True, WHITE)
            window.blit(start_text, (start_button_rect.x + 20, start_button_rect.y + 10))
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()

