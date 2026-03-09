# Sudoku Pro – Web Based Sudoku Puzzle Game

## Overview
Sudoku Pro is an interactive web-based Sudoku puzzle game designed to test logical thinking and problem-solving skills. The application dynamically generates Sudoku puzzles and allows users to play with different difficulty levels while tracking time, score, and statistics.

## Features
- Dynamic Sudoku puzzle generation using a backtracking algorithm
- Multiple difficulty levels (Easy, Medium, Hard)
- Timer and scoring system with penalties and bonuses
- Hint system and solution validation for gameplay assistance

## Technologies Used
- HTML5 – Structure of the web application
- CSS3 – Styling, layout, and responsive design
- JavaScript (Vanilla JS) – Game logic, puzzle generation, scoring system, and interactivity

## How the Game Works
1. A fully solved Sudoku grid is generated using a backtracking algorithm.
2. Cells are removed based on the selected difficulty to create the puzzle.
3. Players fill in numbers following Sudoku rules:
   - Each row must contain numbers **1–9** exactly once.
   - Each column must contain numbers **1–9** exactly once.
   - Each **3×3 grid** must contain numbers **1–9** exactly once.
4. The system validates inputs and checks the final solution.

## Live Demo
https://saipreethipujari.github.io/Sudoku/