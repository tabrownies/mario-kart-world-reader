# Single Frame Classifier

A simple, straightforward Next.js and Express tool to manually complete `UNFINISHED` training data
CSVs.

## Setup

1. Make sure you have Node.js installed.
2. Install dependencies for both the frontend and backend:

   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

## Usage

1. **Prepare the Data**: Ensure there is a CSV file in `../../../training_data/labels/` with
   `UNFINISHED` in the filename. The image frames should be located in
   `../../../training_data/frames/`.

2. **Start the Application**:
   ```bash
   npm run dev
   ```
   This will simultaneously start the frontend at `http://localhost:3000` and the nodemon-backed
   Express server at `http://localhost:3001`.

_Note: The frontend is fully statically exportable. You can also run `npm run build` in the frontend
directory to generate an `out/` folder containing the compiled static HTML/JS/CSS._
