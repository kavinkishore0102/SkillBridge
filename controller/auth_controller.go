package controller

import (
	"SkillBridge/middleware"
	"SkillBridge/models"
	"SkillBridge/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/gorm"
	"net/http"
	"time"
)

var DB *gorm.DB

func InitAuth(db *gorm.DB) {
	DB = db
}

func SignUp(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existUser models.User
	if err := DB.Where("email = ?", user.Email).First(&existUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already Resigtered"})
		return
	}

	// hash the password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash the Password"})
		return
	}

	user.Password = hashedPassword
	if err := DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user in DB"})
		return
	}
	//Status ok
	c.JSON(http.StatusOK, gin.H{"message": "User created successfully"})
}

func Login(c *gin.Context) {
	var credentials struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	err := c.ShouldBindJSON(&credentials)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := DB.Where("email = ?", credentials.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not Find user in DB"})
		return
	}
	if !utils.CheckPassword(user.Password, credentials.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Incorrect email or password"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 12).Unix(),
	})
	tokenStr, _ := token.SignedString(middleware.JWT_SECRET)

	c.JSON(http.StatusOK, gin.H{"token": tokenStr})
}
