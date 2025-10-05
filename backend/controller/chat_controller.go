package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"
)

// SendMessage - Send a chat message
func SendMessage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	var input struct {
		StudentID uint   `json:"student_id" binding:"required"`
		GuideID   uint   `json:"guide_id" binding:"required"`
		Message   string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that the user is either the student or guide in this conversation
	role := userRole.(string)
	uid := userID.(uint)
	
	if role == "student" && uid != input.StudentID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only send messages as yourself"})
		return
	}
	if role == "guide" && uid != input.GuideID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only send messages as yourself"})
		return
	}

	chat := models.Chat{
		StudentID:  input.StudentID,
		GuideID:    input.GuideID,
		Message:    input.Message,
		SenderID:   uid,
		SenderRole: role,
		IsRead:     false,
		CreatedAt:  time.Now(),
	}

	if err := DB.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Load sender information
	DB.Preload("Sender").First(&chat, chat.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"chat":    chat,
	})
}

// GetChatHistory - Get chat history between student and guide
func GetChatHistory(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	studentIDParam := c.Param("student_id")
	guideIDParam := c.Param("guide_id")

	studentID, err := strconv.Atoi(studentIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	guideID, err := strconv.Atoi(guideIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guide ID"})
		return
	}

	// Verify user has access to this conversation
	uid := userID.(uint)
	if uid != uint(studentID) && uid != uint(guideID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var chats []models.Chat
	if err := DB.Where("student_id = ? AND guide_id = ?", studentID, guideID).
		Preload("Sender").
		Order("created_at ASC").
		Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chat history"})
		return
	}

	// Mark messages as read for the current user
	DB.Model(&models.Chat{}).
		Where("student_id = ? AND guide_id = ? AND sender_id != ? AND is_read = ?", 
			studentID, guideID, uid, false).
		Update("is_read", true)

	c.JSON(http.StatusOK, gin.H{
		"chats": chats,
		"count": len(chats),
	})
}

// GetUserConversations - Get all conversations for a user (student or guide)
func GetUserConversations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	uid := userID.(uint)
	role := userRole.(string)

	var conversations []models.ChatConversation

	if role == "student" {
		// Get conversations where user is the student
		DB.Raw(`
			SELECT 
				c.student_id,
				c.guide_id,
				s.name as student_name,
				g.name as guide_name,
				c.message as last_message,
				c.sender_role as last_sender,
				c.created_at as last_sent_at,
				COALESCE(unread.count, 0) as unread_count
			FROM chats c
			JOIN users s ON c.student_id = s.id
			JOIN users g ON c.guide_id = g.id
			LEFT JOIN (
				SELECT student_id, guide_id, COUNT(*) as count
				FROM chats 
				WHERE sender_id != ? AND is_read = false
				GROUP BY student_id, guide_id
			) unread ON c.student_id = unread.student_id AND c.guide_id = unread.guide_id
			WHERE c.student_id = ? 
			AND c.id IN (
				SELECT MAX(id) FROM chats 
				WHERE student_id = ? 
				GROUP BY student_id, guide_id
			)
			ORDER BY c.created_at DESC
		`, uid, uid, uid).Scan(&conversations)
	} else if role == "guide" {
		// Get conversations where user is the guide
		DB.Raw(`
			SELECT 
				c.student_id,
				c.guide_id,
				s.name as student_name,
				g.name as guide_name,
				c.message as last_message,
				c.sender_role as last_sender,
				c.created_at as last_sent_at,
				COALESCE(unread.count, 0) as unread_count
			FROM chats c
			JOIN users s ON c.student_id = s.id
			JOIN users g ON c.guide_id = g.id
			LEFT JOIN (
				SELECT student_id, guide_id, COUNT(*) as count
				FROM chats 
				WHERE sender_id != ? AND is_read = false
				GROUP BY student_id, guide_id
			) unread ON c.student_id = unread.student_id AND c.guide_id = unread.guide_id
			WHERE c.guide_id = ? 
			AND c.id IN (
				SELECT MAX(id) FROM chats 
				WHERE guide_id = ? 
				GROUP BY student_id, guide_id
			)
			ORDER BY c.created_at DESC
		`, uid, uid, uid).Scan(&conversations)
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
		"count":         len(conversations),
	})
}

// StartConversation - Initialize a conversation between student and guide
func StartConversation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	var input struct {
		GuideID uint `json:"guide_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := userRole.(string)
	uid := userID.(uint)

	// Only students can start conversations with guides
	if role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can start conversations with guides"})
		return
	}

	// Verify the guide exists
	var guide models.User
	if err := DB.Where("id = ? AND role = ?", input.GuideID, "guide").First(&guide).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Guide not found"})
		return
	}

	// Get student info
	var student models.User
	if err := DB.First(&student, uid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Check if conversation already exists
	var existingChat models.Chat
	err := DB.Where("student_id = ? AND guide_id = ?", uid, input.GuideID).First(&existingChat).Error
	
	if err == nil {
		// Conversation exists, return it
		c.JSON(http.StatusOK, gin.H{
			"message":     "Conversation already exists",
			"student_id":  uid,
			"guide_id":    input.GuideID,
			"guide_name":  guide.Name,
			"student_name": student.Name,
		})
		return
	}

	// Create initial welcome message from the system
	initialChat := models.Chat{
		StudentID:  uid,
		GuideID:    input.GuideID,
		Message:    "Conversation started! Feel free to ask your guide any questions.",
		SenderID:   uid,
		SenderRole: "student",
		IsRead:     false,
		CreatedAt:  time.Now(),
	}

	if err := DB.Create(&initialChat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start conversation"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Conversation started successfully",
		"student_id":   uid,
		"guide_id":     input.GuideID,
		"guide_name":   guide.Name,
		"student_name": student.Name,
	})
}

// GetConnectedGuides - Get guides that student is already connected with
func GetConnectedGuides(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	uid := userID.(uint)
	role := userRole.(string)

	// Only students can get their connected guides
	if role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can access this endpoint"})
		return
	}

	var connectedGuideIds []uint
	DB.Model(&models.Chat{}).
		Where("student_id = ?", uid).
		Distinct("guide_id").
		Pluck("guide_id", &connectedGuideIds)

	c.JSON(http.StatusOK, gin.H{
		"connected_guide_ids": connectedGuideIds,
		"count":              len(connectedGuideIds),
	})
}