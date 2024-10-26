import fs from 'fs';
import multer from 'multer';
import PDFParser from 'pdf2json';
import path from 'path';
import { fileURLToPath } from 'url';
import { start } from 'repl';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const timeRegex = /(?=.*(?:AM|PM)).*:.*$/;

const upload = multer({
    dest: 'uploads/', // Directory where uploaded files will be stored
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    }
});

let requestQueue = [];
let processing = false;

function parseStudentInfo(dataArray) {
    // Regex for matching the degree (Bachelor of, Doctor of, Master of)
    const degreeRegex = /^(Bachelor|Doctor|Master)\s+of\s+/;

    // Regex for matching the semester and academic year
    const semesterRegex = /([1-3](?:st|nd|rd))\s*(?:Semester)?\s*(?:AY)?\s*(\d{4})-(\d{4})/i;

    // Initialize variables for department, degree, yearLevel, section, and semester/AY
    let department = '';
    let degree = '';
    let yearLevel = '';
    let section = '';
    let SY = null;

    // Check if we need to merge department
    let departmentMerged = false;

    // Loop through the data
    dataArray.forEach((item, index) => {
        // Detect degree first (e.g., "Bachelor of", "Master of", etc.)
        if (degreeRegex.test(item)) {
            degree = item;

            // Check if the previous two elements are the department (merged case)
            if (index >= 2 && !departmentMerged) {
                department = dataArray[index - 2] + ' ' + dataArray[index - 1];
                departmentMerged = true;
            }
        }

        // Detect year level (e.g., "4th Year")
        if (/(\d{1})(st|nd|rd|th)\s+Year/.test(item)) {
            yearLevel = item;
        }

        // Detect section (e.g., "BSIT", "MSIT", "BS Biology", etc.)
        if (/^BS|MS|PhD/.test(item)) {
            section = item;
        }

        // Detect semester and academic year (e.g., "1st Semester AY 2024-2025")
        const semesterMatch = item.match(semesterRegex);
        if (semesterMatch) {
            SY = {
                semester: semesterMatch[1],
                start: parseInt(semesterMatch[2]),
                end: parseInt(semesterMatch[3])
            };
        }

        // If no merging needed and only one department
        if (!departmentMerged && index === 0 && degreeRegex.test(dataArray[index + 1])) {
            department = dataArray[index];
        }
    });

    // Disregard the last item if it does not contain relevant information
    if (dataArray.length > 0 && !degreeRegex.test(dataArray[dataArray.length - 1]) && !semesterRegex.test(dataArray[dataArray.length - 1])) {
        dataArray.pop();
    }

    return {
        department,
        degree,
        yearLevel,
        section,
        SY
    };
}
const processQueue = async () => {
    if (processing) {
        console.log('Request queue is already being processed...');
        return;
    }
    
    console.log('Queue length:', requestQueue.length);
    processing = true;

    while (requestQueue.length > 0) {
        const { req, res, next } = requestQueue.shift();
        try {
            await handleRequest(req, res);
        } catch (error) {
            console.error('Error handling request:', error);
            if (!res.headersSent) {
                res.status(500).send('Internal Server Error');
            }
        }
    }

    processing = false;
};

const handleRequest = async (req, res) => {
    const filePath = req.file.path;
    let responseSent = false;

    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData) => {
        if (!responseSent) {
            responseSent = true;
            console.error(errData.parserError);
            res.status(500).send('Error parsing PDF');
        }
        deleteFile(filePath);  // Ensure file is deleted on error
    });
    pdfParser.on("readable", (meta) => {
        //when pdf is not generated from student portal
        if (meta && meta.Meta){
            if(!meta.Meta.Creator.includes(process.env.PDF_CREATOR) || !meta.Meta.Producer.includes(process.env.PDF_PRODUCER)){
                responseSent = true;
                deleteFile(filePath);
                return res.status(400).json({
                    message: 'Invalid PDF file. Please upload a official and unaltered COR from student portal.',
                })
            }
        }
    });
    pdfParser.on('pdfParser_dataReady', async (pdfData) => {
        if (responseSent) return; // Avoid double responses
        const texts = extractText(pdfData);

        if(!texts) return res.status(400).json({
            message: 'Invalid PDF file. Please upload a official and unaltered COR from student portal.',
        })


        let details = extractDetails(texts);
        const schedules = groupSchedules(extractScheduleBlock(texts));

        const otherDetails = parseStudentInfo(texts.slice(22, 29))

        details = {...details, ...otherDetails}
        responseSent = true;
        deleteFile(filePath);

        res.status(200).json({
            message: 'PDF parsed and schedules extracted.',
            schedules,
            details
        });
    });

    pdfParser.loadPDF(filePath);
};


const groupSchedules = (texts) => {
    let schedules = [];
    let subjectSchedule = [];
    let started = true;

    for (let i = 0; i < texts.length; i++) {
        if (started) {
            subjectSchedule.push(texts[i]);
            started = false;
        } else {
            if (texts[i].length === 1) {
                continue;  // Skip single-character entries
            } else if (texts[i].match(timeRegex) && texts[i + 1].length !== 1) {
                subjectSchedule.push(texts[i]);
                i++;
                if (subjectSchedule.length > 0) {
                    schedules.push(subjectSchedule);
                }
                subjectSchedule = [];
            } else if (texts[i].match(timeRegex) && texts[i + 1].length === 1) {
                started = true;
                if (subjectSchedule.length > 0) {
                    schedules.push(subjectSchedule);
                }
                subjectSchedule = [];
                i--;
            } else {
                subjectSchedule.push(texts[i]);
            }
        }
    }

    if (subjectSchedule.length > 0) {
        schedules.push(subjectSchedule);
    }

    return schedules;
};


const extractText = (data) => {
    let texts = [];
    
    const headerContent = decodeURIComponent(data.Pages[0].Texts[0].R[0].T);
    const cleanedHeader = headerContent.replace(/\n|\s+/g, ' ').trim();

    if(cleanedHeader !== process.env.PDF_HEADER) {
        return false
    }

    if (data.Pages) {
        data.Pages.forEach((page) => {
            if (page.Texts) {
                page.Texts.forEach((text) => {
                    const textContent = decodeURIComponent(text.R[0].T);
                    const cleanedText = textContent.replace(/\n|\s+/g, ' ').trim();
                    texts.push(cleanedText);
                });
            }
        });
    }
    return texts;
};

const extractDetails = (texts) => ({
    studentNumber: texts[18],
    studentName: texts[19],
});

const extractScheduleBlock = (texts) => {
    let inScheduleBlock = false;
    let scheduleBlock = [];
    
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (text === 'Credit') {
            inScheduleBlock = true;
            continue;
        }
        if (inScheduleBlock) {
            if (text === 'Total Unit(s)') {
                inScheduleBlock = false;
                scheduleBlock.pop();
                scheduleBlock.pop();
                break;
            }
            scheduleBlock.push(text);
        }
    }
    
    return scheduleBlock;
};

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err}`);
        } else {
            console.log('Temporary file deleted');
        }
    });
};

const parseCOR = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).send(err.message);
        }

        requestQueue.push({ req, res, next });
        processQueue();
    });
};

export default parseCOR;
