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
	var err error

	if role == "student" {
		// Get conversations where user is the student
		err = DB.Raw(`
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
		`, uid, uid, uid).Scan(&conversations).Error
	} else if role == "guide" {
		// Get conversations where user is the guide
		err = DB.Raw(`
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
		`, uid, uid, uid).Scan(&conversations).Error
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "This endpoint is only available for students and guides"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
		"count":         len(conversations),
	})
}

// StartConversation - Create a pending connection request from student to guide
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

	// Only students can request connections with guides
	if role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can request connections with guides"})
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

	// Check if a connection request already exists
	var existingRequest models.GuideConnectionRequest
	err := DB.Where("student_id = ? AND guide_id = ?", uid, input.GuideID).First(&existingRequest).Error
	
	if err == nil {
		// Request already exists
		if existingRequest.Status == "accepted" {
			// If already accepted, check if chat exists
			var existingChat models.Chat
			chatErr := DB.Where("student_id = ? AND guide_id = ?", uid, input.GuideID).First(&existingChat).Error
			
			if chatErr == nil {
				// Chat already exists
				c.JSON(http.StatusOK, gin.H{
					"message":     "Conversation already exists",
					"student_id":  uid,
					"guide_id":    input.GuideID,
					"guide_name":  guide.Name,
					"student_name": student.Name,
				})
				return
			}

			// Create initial welcome message
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
			return
		}

		// Request is pending or rejected
		c.JSON(http.StatusConflict, gin.H{
			"message": "Connection request already " + existingRequest.Status,
			"status":  existingRequest.Status,
		})
		return
	}

	// Create a new connection request with pending status
	connectionRequest := models.GuideConnectionRequest{
		StudentID: uid,
		GuideID:   input.GuideID,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	if err := DB.Create(&connectionRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create connection request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Connection request sent to guide. Waiting for confirmation.",
		"student_id":   uid,
		"guide_id":     input.GuideID,
		"guide_name":   guide.Name,
		"student_name": student.Name,
		"status":       "pending",
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

// GetPendingConfirmations - Get pending student connection requests for a guide
func GetPendingConfirmations(c *gin.Context) {
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

	role := userRole.(string)
	guideID := userID.(uint)

	// Only guides can see pending confirmations
	if role != "guide" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only guides can access this endpoint"})
		return
	}

	var requests []models.GuideConnectionRequest
	if err := DB.
		Preload("Student").
		Where("guide_id = ? AND status = ?", guideID, "pending").
		Order("created_at DESC").
		Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_requests": requests,
		"count":           len(requests),
	})
}

// ConfirmConnection - Guide accepts or rejects a student connection request
func ConfirmConnection(c *gin.Context) {
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

	role := userRole.(string)
	guideID := userID.(uint)

	// Only guides can confirm connections
	if role != "guide" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only guides can confirm connections"})
		return
	}

	var input struct {
		RequestID uint   `json:"request_id" binding:"required"`
		Action    string `json:"action" binding:"required"` // "accept" or "reject"
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Action != "accept" && input.Action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Action must be 'accept' or 'reject'"})
		return
	}

	// Get the connection request
	var request models.GuideConnectionRequest
	if err := DB.First(&request, input.RequestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Verify this guide owns this request
	if request.GuideID != guideID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only confirm your own requests"})
		return
	}

	// Update request status
	newStatus := "rejected"
	if input.Action == "accept" {
		newStatus = "accepted"
	}

	if err := DB.Model(&request).Update("status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
		return
	}

	// If accepted, create the actual conversation with initial message
	if newStatus == "accepted" {
		// Check if chat already exists
		var existingChat models.Chat
		chatErr := DB.Where("student_id = ? AND guide_id = ?", request.StudentID, request.GuideID).First(&existingChat).Error
		
		if chatErr != nil {
			// Chat doesn't exist, create initial message
			initialChat := models.Chat{
				StudentID:  request.StudentID,
				GuideID:    request.GuideID,
				Message:    "Your connection request has been accepted! Your guide is ready to help you.",
				SenderID:   guideID,
				SenderRole: "guide",
				IsRead:     false,
				CreatedAt:  time.Now(),
			}

			if err := DB.Create(&initialChat).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conversation"})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Connection request " + newStatus,
		"request_id": request.ID,
		"status":    newStatus,
	})
}