const Blog = require('../models/Blog');

// Create blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

    const blog = await Blog.create({
      title, content, tags: tags || [], author: req.user._id
    });

    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all blogs (with pagination)
exports.getBlogs = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const total = await Blog.countDocuments();
    const blogs = await Blog.find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ total, page, limit, blogs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get one blog
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username email')
      .populate('comments.user', 'username email');

    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update blog (only author)
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    blog.tags = req.body.tags || blog.tags;

    const updated = await blog.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete blog (only author)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    await blog.remove();
    res.json({ message: 'Blog removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const userId = req.user._id.toString();
    const already = blog.likes.map(l => l.toString()).includes(userId);
    if (already) {
      blog.likes = blog.likes.filter(l => l.toString() !== userId);
    } else {
      blog.likes.push(req.user._id);
    }
    await blog.save();
    res.json({ likesCount: blog.likes.length, liked: !already });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.comments.push({ user: req.user._id, text });
    await blog.save();

    const updated = await Blog.findById(req.params.blogId).populate('comments.user', 'username');
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete comment (comment owner or blog author or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isBlogAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isBlogAuthor && !isAdmin)
      return res.status(403).json({ message: 'Not authorized to delete this comment' });

    comment.remove();
    await blog.save();
    res.json({ message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
