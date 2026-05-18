const request = require('supertest');
const fs = require('fs');
const app = require('./index');

// Mock fs module
jest.mock('fs');
// Mock the readCsv and writeCsv functions indirectly by mocking fast-csv
// But actually it's easier to just mock the helper functions inside index.js 
// However, they are not exported. 
// So we will mock fs streams and fast-csv

// We will test the API endpoints assuming the file doesn't exist to check basic 404/done behavior
describe('Backend API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/frames returns done if no UNFINISHED csv exists', async () => {
        // Setup fs.existsSync and fs.readdirSync to return no files
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['finished_file.csv']);

        const res = await request(app).get('/api/frames');
        expect(res.statusCode).toBe(200);
        expect(res.body.done).toBe(true);
        expect(res.body.message).toContain('No UNFINISHED CSV found');
    });

    it('POST /api/save returns 404 if no UNFINISHED csv exists', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['finished_file.csv']);

        const res = await request(app)
            .post('/api/save')
            .send({ frame_id: 'test', updatedData: {} });
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toContain('No UNFINISHED CSV found');
    });
});
