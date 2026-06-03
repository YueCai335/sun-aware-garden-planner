# Resume Positioning

## Project Title Options

- Sun-Aware Garden Planner
- AI Garden Copilot
- Geospatial AI Garden Planner
- Backyard Digital Twin for Sun-Aware Planting

## Resume One-Liner

Built a geospatial AI garden planner that converts yard imagery and coordinates into sun-exposure heatmaps and RAG-grounded planting recommendations.

## Strong Resume Bullets

- Implemented a solar-position and shadow-projection engine to estimate full-sun, part-sun, and shaded garden zones from user-marked yard geometry.
- Built a Next.js annotation UI for marking buildings, trees, fences, and planting beds on aerial yard images.
- Developed a RAG pipeline over horticulture and local climate sources to generate explainable plant recommendations.
- Designed an agentic workflow for sun analysis, plant matching, layout planning, and seasonal care task generation.
- Added structured garden memory for planting history, fertilizer logs, weather events, and crop rotation reasoning.
- Deployed a full-stack application with PostgreSQL, vector search, Docker, and CI/CD.

## Why It Is Better Than A Generic App

Generic:

- Gardening tracker.
- CRUD app.
- AI chatbot wrapper.
- PDF question-answering bot.

This project:

- Has a real user problem.
- Uses deterministic algorithms where accuracy matters.
- Uses AI where reasoning and explanation help.
- Combines full-stack, geospatial, RAG, agents, and visualization.
- Has a personal real-world test site.

## Interview Story

Problem:

Beginner gardeners cannot easily tell which yard areas are full sun, part sun, or shade, and plant labels are hard to apply to real spaces.

Approach:

I built a system where users upload an aerial image, mark obstacles, enter approximate heights, and generate a sun exposure heatmap using solar geometry and shadow projection. A RAG-based assistant then recommends plants for each light zone based on local climate and horticulture sources.

Tradeoff:

I chose a semi-automatic MVP instead of fully automatic 3D reconstruction because it gives useful results while keeping the system explainable and achievable.

