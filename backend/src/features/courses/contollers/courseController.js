import Course from "../model/coursesModel.js";

export const createCourse = async (req, res) => {
    const { courseId, courseName, videos } = req.body;

    try {
        const course = await Course.create({ courseId, courseName, videos });
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating course",
            error: error.message    
        });
    }
};

export const getCoursesByID = async (req, res) => {
    try {
        const {id} = req.params;
        const courses = await Course.findById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching courses",
            error: error.message
        });
    }
};








