const path = require('path');
const fs = require('fs');

// @desc    Upload image file
// @route   POST /api/website/upload
// @access  Private (Admin only)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Return the file path - will be served from /uploads
    // Frontend will need to construct full URL or use relative path
    const filePath = `/uploads/${req.file.filename}`;
    
    // Construct full URL if needed (for production)
    const baseUrl = req.protocol + '://' + req.get('host');
    const fullUrl = baseUrl + filePath;
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: filePath, // Relative path for frontend to use
        fullUrl: fullUrl, // Full URL if needed
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// @desc    Delete uploaded image
// @route   DELETE /api/website/upload/:filename
// @access  Private (Admin only)
exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

