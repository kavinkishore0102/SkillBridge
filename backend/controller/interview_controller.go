package controller

import (
	"SkillBridge/models"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetInterviewResources fetches resources based on user skills
func GetInterviewResources(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Fetch user to get skills
	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	var userSkills []string
	if user.Skills != "" {
		rawSkills := strings.Split(user.Skills, ",")
		for _, s := range rawSkills {
			cleaned := strings.TrimSpace(strings.ToLower(s))
			if cleaned != "" {
				userSkills = append(userSkills, cleaned)
			}
		}
	}

	// Fetch resources matching skills
	var resources []models.InterviewResource

	if len(userSkills) > 0 {
		query := DB.Model(&models.InterviewResource{})
		var conditions []string
		var args []interface{}

		for _, skill := range userSkills {
			conditions = append(conditions, "LOWER(skill) LIKE ?")
			args = append(args, "%"+skill+"%")
		}

		if len(conditions) > 0 {
			query = query.Where(strings.Join(conditions, " OR "), args...)
		}

		query.Find(&resources)
	} else {
		resources = []models.InterviewResource{}
	}

	// Organize by type and track which skills have DB entries
	var videos []models.InterviewResource
	var questions []models.InterviewResource

	skillsWithVideos := make(map[string]bool)
	skillsWithQuestions := make(map[string]bool)

	for _, r := range resources {
		if r.Type == "video" {
			videos = append(videos, r)
			skillsWithVideos[strings.ToLower(r.Skill)] = true
		} else if r.Type == "question" {
			questions = append(questions, r)
			skillsWithQuestions[strings.ToLower(r.Skill)] = true
		}
	}

	// For any skill not in the DB, generate dynamic links
	for i, skill := range userSkills {
		skillEncoded := strings.ReplaceAll(skill, " ", "+")
		skillTitle := strings.Title(skill)

		// Dynamic Videos — if no DB videos exist for this skill
		if !skillsWithVideos[skill] {
			dynamicVideos := []models.InterviewResource{
				{
					ID:          uint(10000 + i*10 + 1),
					Skill:       skill,
					Type:        "video",
					Title:       skillTitle + " Interview Questions & Tutorials (YouTube)",
					URL:         "https://www.youtube.com/results?search_query=" + skillEncoded + "+interview+questions",
					Difficulty:  "All Levels",
					Description: "Search YouTube for the best " + skillTitle + " interview preparation videos.",
				},
				{
					ID:          uint(10000 + i*10 + 2),
					Skill:       skill,
					Type:        "video",
					Title:       "Learn " + skillTitle + " from Scratch (YouTube)",
					URL:         "https://www.youtube.com/results?search_query=learn+" + skillEncoded + "+for+beginners+full+course",
					Difficulty:  "Beginner",
					Description: "Find beginner-friendly " + skillTitle + " courses on YouTube.",
				},
				{
					ID:          uint(10000 + i*10 + 3),
					Skill:       skill,
					Type:        "video",
					Title:       skillTitle + " Full Course - FreeCodeCamp Search",
					URL:         "https://www.youtube.com/@freecodecamp/search?query=" + skillEncoded,
					Difficulty:  "Intermediate",
					Description: "Search FreeCodeCamp's YouTube channel for " + skillTitle + " tutorials.",
				},
			}
			videos = append(videos, dynamicVideos...)
		}

		// Dynamic Questions — if no DB questions exist for this skill
		if !skillsWithQuestions[skill] {
			dynamicQuestions := []models.InterviewResource{
				{
					ID:         uint(20000 + i*10 + 1),
					Skill:      skill,
					Type:       "question",
					Title:      skillTitle + " Interview Questions - GeeksforGeeks",
					URL:        "https://www.geeksforgeeks.org/" + strings.ReplaceAll(skill, " ", "-") + "-interview-questions/",
					Difficulty: "All Levels",
					Content:    "Browse a comprehensive list of " + skillTitle + " interview questions on GeeksforGeeks, covering beginner to advanced topics.",
				},
				{
					ID:         uint(20000 + i*10 + 2),
					Skill:      skill,
					Type:       "question",
					Title:      skillTitle + " Interview Questions - InterviewBit",
					URL:        "https://www.interviewbit.com/search/?q=" + skillEncoded + "+interview+questions",
					Difficulty: "Intermediate",
					Content:    "Practice " + skillTitle + " interview questions on InterviewBit with answers and explanations.",
				},
				{
					ID:         uint(20000 + i*10 + 3),
					Skill:      skill,
					Type:       "question",
					Title:      skillTitle + " Problems - LeetCode",
					URL:        "https://leetcode.com/tag/" + strings.ReplaceAll(skill, " ", "-") + "/",
					Difficulty: "Advanced",
					Content:    "Solve " + skillTitle + " coding problems on LeetCode to prepare for technical interviews.",
				},
				{
					ID:         uint(20000 + i*10 + 4),
					Skill:      skill,
					Type:       "question",
					Title:      skillTitle + " Interview Questions - Glassdoor",
					URL:        "https://www.glassdoor.com/Interview/" + skillEncoded + "-interview-questions-SRCH_KT0," + fmt.Sprintf("%d", len(skill)) + ".htm",
					Difficulty: "All Levels",
					Content:    "See real " + skillTitle + " interview questions asked at top companies, shared by candidates on Glassdoor.",
				},
				{
					ID:         uint(20000 + i*10 + 5),
					Skill:      skill,
					Type:       "question",
					Title:      skillTitle + " Tutorial & FAQ - TutorialsPoint",
					URL:        "https://www.tutorialspoint.com/" + strings.ReplaceAll(skill, " ", "_") + "/index.htm",
					Difficulty: "Beginner",
					Content:    "Read " + skillTitle + " tutorials and commonly asked questions on TutorialsPoint.",
				},
			}
			questions = append(questions, dynamicQuestions...)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"videos":    videos,
		"questions": questions,
	})
}

// SeedInterviewResources populates the database with initial data
func SeedInterviewResources() {
	var count int64
	DB.Model(&models.InterviewResource{}).Count(&count)
	if count > 0 {
		return // Already seeded
	}

	resources := []models.InterviewResource{
		// Python Videos (10)
		{Skill: "python", Type: "video", Title: "Python for Beginners - Full Course", URL: "https://www.youtube.com/watch?v=_uQrJ0TkZlc", Difficulty: "Beginner", Description: "Programming with Mosh - Learn Python in 1 hour"},
		{Skill: "python", Type: "video", Title: "Python Tutorial for Beginners (Full Course)", URL: "https://www.youtube.com/watch?v=kqtD5dpn9C8", Difficulty: "Beginner", Description: "Programming with Mosh - 6 hour Python course"},
		{Skill: "python", Type: "video", Title: "Learn Python - Full Course for Beginners", URL: "https://www.youtube.com/watch?v=rfscVS0vtbw", Difficulty: "Beginner", Description: "FreeCodeCamp - Complete Python tutorial"},
		{Skill: "python", Type: "video", Title: "Python Interview Questions And Answers", URL: "https://www.youtube.com/watch?v=jOsEAJk2ZkM", Difficulty: "Intermediate", Description: "Edureka - Best Python interview questions"},
		{Skill: "python", Type: "video", Title: "Python OOP Tutorial", URL: "https://www.youtube.com/watch?v=ZDa-Z5JzVDM", Difficulty: "Intermediate", Description: "Corey Schafer - Object-Oriented Programming in Python"},
		{Skill: "python", Type: "video", Title: "Python Django Tutorial", URL: "https://www.youtube.com/watch?v=F5mRW0jo-U4", Difficulty: "Advanced", Description: "Learn Django for Web Development"},
		{Skill: "python", Type: "video", Title: "Python Decorators", URL: "https://www.youtube.com/watch?v=FsAPt_9Bf3U", Difficulty: "Advanced", Description: "Corey Schafer - In-depth guide to Decorators"},
		{Skill: "python", Type: "video", Title: "Python FastAPI Tutorial", URL: "https://www.youtube.com/watch?v=0sOvCWFmrtA", Difficulty: "Intermediate", Description: "Learn FastAPI to build high-performance APIs"},
		{Skill: "python", Type: "video", Title: "Data Structures in Python", URL: "https://www.youtube.com/watch?v=pkYVOmU3MgA", Difficulty: "Intermediate", Description: "Data Structures and Algorithms in Python"},
		{Skill: "python", Type: "video", Title: "Python Generators", URL: "https://www.youtube.com/watch?v=bD05uBv2Sko", Difficulty: "Advanced", Description: "Corey Schafer - How to use Generators"},

		// Python Questions
		{Skill: "python", Type: "question", Title: "Decorators", Content: "Explain the purpose of decorators in Python and provide an example of how to implement one.", URL: "https://realpython.com/primer-on-python-decorators/", Difficulty: "Intermediate"},
		{Skill: "python", Type: "question", Title: "GIL (Global Interpreter Lock)", Content: "What is the GIL and how does it affect multi-threading in Python?", URL: "https://realpython.com/python-gil/", Difficulty: "Advanced"},
		{Skill: "python", Type: "question", Title: "Lists vs Tuples", Content: "What is the key difference between a Python List and a Tuple, and when should you use each?", URL: "https://www.geeksforgeeks.org/python-difference-between-list-and-tuple/", Difficulty: "Beginner"},
		{Skill: "python", Type: "question", Title: "List Comprehensions", Content: "What is a list comprehension? Provide an example of converting a loop into a list comprehension.", URL: "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions", Difficulty: "Beginner"},
		{Skill: "python", Type: "question", Title: "Generators vs Iterators", Content: "Explain the difference between a generator and an iterator. How does the 'yield' keyword work?", URL: "https://realpython.com/introduction-to-python-generators/", Difficulty: "Advanced"},
		{Skill: "python", Type: "question", Title: "Magic Methods (Dunder)", Content: "What are magic methods in Python? Explain __init__ and __str__.", URL: "https://rszalski.github.io/magicmethods/", Difficulty: "Intermediate"},

		// Java Videos (10)
		{Skill: "java", Type: "video", Title: "Java Tutorial for Beginners", URL: "https://www.youtube.com/watch?v=eIrMbAQSU34", Difficulty: "Beginner", Description: "Programming with Mosh - Java Basics"},
		{Skill: "java", Type: "video", Title: "Learn Java in 14 Minutes", URL: "https://www.youtube.com/watch?v=RRubcjpTkks", Difficulty: "Beginner", Description: "Bro Code - Quick Java overview"},
		{Skill: "java", Type: "video", Title: "Top 50 Java Interview Questions", URL: "https://www.youtube.com/watch?v=Hl-zzrqQoSE", Difficulty: "Intermediate", Description: "Edureka - Most asked Java questions"},
		{Skill: "java", Type: "video", Title: "Java OOPs Concepts", URL: "https://www.youtube.com/watch?v=a199KZGMNxk", Difficulty: "Intermediate", Description: "Object-Oriented Programming in Java"},
		{Skill: "java", Type: "video", Title: "Java Multithreading", URL: "https://www.youtube.com/watch?v=TCjd7Z2D5Hk", Difficulty: "Advanced", Description: "Learn Multithreading in Java"},
		{Skill: "java", Type: "video", Title: "Java Streams API", URL: "https://www.youtube.com/watch?v=t1-YZ6bF-g0", Difficulty: "Intermediate", Description: "Amigoscode - Java Streams"},
		{Skill: "java", Type: "video", Title: "Spring Boot Tutorial", URL: "https://www.youtube.com/watch?v=9SGDpanrc8U", Difficulty: "Advanced", Description: "Amigoscode - Complete Spring Boot Course"},
		{Skill: "java", Type: "video", Title: "Java Collections Framework", URL: "https://www.youtube.com/watch?v=viZWzxsGcAM", Difficulty: "Intermediate", Description: "Complete Collections tutorial"},
		{Skill: "java", Type: "video", Title: "Java Memory Management", URL: "https://www.youtube.com/watch?v=2TPEhB41jK8", Difficulty: "Advanced", Description: "Understanding the JVM and Garbage Collection"},
		{Skill: "java", Type: "video", Title: "Java Basics to Advanced", URL: "https://www.youtube.com/watch?v=hBh_CC5y8-s", Difficulty: "Intermediate", Description: "Complete Java Guide"},

		// Java Questions
		{Skill: "java", Type: "question", Title: "JVM vs JRE vs JDK", Content: "What is the difference between JVM, JRE, and JDK? Explain the compilation process.", URL: "https://www.geeksforgeeks.org/difference-between-jdk-jre-and-jvm/", Difficulty: "Beginner"},
		{Skill: "java", Type: "question", Title: "HashMap Internal Working", Content: "How does a HashMap work internally in Java? Discuss hashing and collisions.", URL: "https://www.geeksforgeeks.org/internal-working-of-hashmap-java/", Difficulty: "Advanced"},
		{Skill: "java", Type: "question", Title: "String vs StringBuilder", Content: "Why are Strings immutable in Java and when should you use StringBuilder instead of StringBuffer?", URL: "https://www.geeksforgeeks.org/string-vs-stringbuilder-vs-stringbuffer-in-java/", Difficulty: "Intermediate"},
		{Skill: "java", Type: "question", Title: "Interfaces vs Abstract Classes", Content: "When would you choose to use an Interface over an Abstract Class in modern Java (Java 8+)?", URL: "https://www.baeldung.com/java-interface-vs-abstract-class", Difficulty: "Intermediate"},
		{Skill: "java", Type: "question", Title: "Final, Finally, Finalize", Content: "Explain the differences between the keywords final, finally, and the method finalize() in Java.", URL: "https://www.javatpoint.com/difference-between-final-finally-and-finalize", Difficulty: "Beginner"},

		// React Videos (10)
		{Skill: "react", Type: "video", Title: "React Tutorial for Beginners", URL: "https://www.youtube.com/watch?v=SqcY0GlETPk", Difficulty: "Beginner", Description: "Programming with Mosh - React basics"},
		{Skill: "react", Type: "video", Title: "React JS - Full Course", URL: "https://www.youtube.com/watch?v=bMknfKXIFA8", Difficulty: "Beginner", Description: "FreeCodeCamp - Complete React 18 Course"},
		{Skill: "react", Type: "video", Title: "Top React Interview Questions", URL: "https://www.youtube.com/watch?v=w7ejDZ8SWv8", Difficulty: "Intermediate", Description: "Edureka - Most asked React questions"},
		{Skill: "react", Type: "video", Title: "React Hooks Course", URL: "https://www.youtube.com/watch?v=cF2lQ_gZeA8", Difficulty: "Intermediate", Description: "Web Dev Simplified - All React Hooks Explained"},
		{Skill: "react", Type: "video", Title: "React Redux Tutorial", URL: "https://www.youtube.com/watch?v=9boMnm5X9ak", Difficulty: "Advanced", Description: "Codevolution - Learn Redux Toolkit"},
		{Skill: "react", Type: "video", Title: "Next.js Full Course", URL: "https://www.youtube.com/watch?v=ZVnjOPwW4ZA", Difficulty: "Advanced", Description: "Learn Next.js for production React apps"},
		{Skill: "react", Type: "video", Title: "React Context API", URL: "https://www.youtube.com/watch?v=5LrDIWkK_Bc", Difficulty: "Intermediate", Description: "Web Dev Simplified - state management"},
		{Skill: "react", Type: "video", Title: "React Performance Optimization", URL: "https://www.youtube.com/watch?v=RcPqGeq_Dls", Difficulty: "Advanced", Description: "useMemo, useCallback, and React.memo"},
		{Skill: "react", Type: "video", Title: "React Router Crash Course", URL: "https://www.youtube.com/watch?v=aZGzwgWAXk4", Difficulty: "Intermediate", Description: "Learn client-side routing"},
		{Skill: "react", Type: "video", Title: "Styled Components Tutorial", URL: "https://www.youtube.com/watch?v=WqqxEp3D1NU", Difficulty: "Beginner", Description: "CSS in JS for React"},

		// React Questions
		{Skill: "react", Type: "question", Title: "Virtual DOM", Content: "What is the Virtual DOM and how does it improve performance compared to manipulating the real DOM?", URL: "https://reactjs.org/docs/faq-internals.html", Difficulty: "Intermediate"},
		{Skill: "react", Type: "question", Title: "Hooks lifecycle", Content: "Explain the rules of Hooks. What is the difference between useEffect and useLayoutEffect?", URL: "https://kentcdodds.com/blog/useeffect-vs-uselayouteffect", Difficulty: "Advanced"},
		{Skill: "react", Type: "question", Title: "Prop Drilling", Content: "What is prop drilling and what are some ways to avoid it?", URL: "https://kentcdodds.com/blog/prop-drilling", Difficulty: "Beginner"},
		{Skill: "react", Type: "question", Title: "Controlled vs Uncontrolled", Content: "What is the difference between controlled and uncontrolled components in React forms?", URL: "https://react.dev/learn/sharing-state-between-components", Difficulty: "Intermediate"},
		{Skill: "react", Type: "question", Title: "React.memo", Content: "When should you use React.memo, useMemo, and useCallback for performance optimization?", URL: "https://kentcdodds.com/blog/usememo-and-usecallback", Difficulty: "Advanced"},

		// JavaScript Videos (10)
		{Skill: "javascript", Type: "video", Title: "JavaScript Tutorial for Beginners", URL: "https://www.youtube.com/watch?v=W6NZfCO5SIk", Difficulty: "Beginner", Description: "Programming with Mosh - JS Basics"},
		{Skill: "javascript", Type: "video", Title: "JavaScript Full Course", URL: "https://www.youtube.com/watch?v=jS4aFq5-91M", Difficulty: "Beginner", Description: "FreeCodeCamp - JS for Beginners"},
		{Skill: "javascript", Type: "video", Title: "JavaScript Interview Questions", URL: "https://www.youtube.com/watch?v=Mac6G2y2vW8", Difficulty: "Intermediate", Description: "Top JS Interview Questions"},
		{Skill: "javascript", Type: "video", Title: "Asynchronous JavaScript", URL: "https://www.youtube.com/watch?v=PoRJizFvM7s", Difficulty: "Intermediate", Description: "Promises, Async/Await, Callbacks"},
		{Skill: "javascript", Type: "video", Title: "The Event Loop", URL: "https://www.youtube.com/watch?v=8aGhZQkoFbQ", Difficulty: "Advanced", Description: "JS Conf - What the heck is the event loop?"},
		{Skill: "javascript", Type: "video", Title: "JavaScript Closures", URL: "https://www.youtube.com/watch?v=3a0I8ICR1Vg", Difficulty: "Advanced", Description: "Web Dev Simplified - Closures Explained"},
		{Skill: "javascript", Type: "video", Title: "ES6 Features", URL: "https://www.youtube.com/watch?v=NCwa_xi0Uuc", Difficulty: "Intermediate", Description: "Modern JavaScript Features"},
		{Skill: "javascript", Type: "video", Title: "Array Methods", URL: "https://www.youtube.com/watch?v=R8rmfD9Y5-c", Difficulty: "Beginner", Description: "Map, Filter, Reduce"},
		{Skill: "javascript", Type: "video", Title: "JavaScript OOP", URL: "https://www.youtube.com/watch?v=PFmuCDHHpwk", Difficulty: "Intermediate", Description: "Object Oriented JS"},
		{Skill: "javascript", Type: "video", Title: "JavaScript Pro Tips", URL: "https://www.youtube.com/watch?v=Mus_vwhTCq0", Difficulty: "Advanced", Description: "Fireship - Write Better Code"},

		// JavaScript Questions
		{Skill: "javascript", Type: "question", Title: "Closures", Content: "What is a closure in JavaScript? Provide a practical use case where a closure is helpful.", URL: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures", Difficulty: "Intermediate"},
		{Skill: "javascript", Type: "question", Title: "Event Loop", Content: "Explain the Event Loop in JavaScript. How do the Call Stack, Web APIs, and Task Queue interact?", URL: "https://javascript.info/event-loop", Difficulty: "Advanced"},
		{Skill: "javascript", Type: "question", Title: "Hoisting", Content: "What is hoisting in JavaScript? How does it differ between var, let, and const?", URL: "https://developer.mozilla.org/en-US/docs/Glossary/Hoisting", Difficulty: "Beginner"},
		{Skill: "javascript", Type: "question", Title: "Promises vs async/await", Content: "Explain the difference between using Promises (.then/.catch) and async/await syntax.", URL: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises", Difficulty: "Intermediate"},
		{Skill: "javascript", Type: "question", Title: "this keyword", Content: "How does the 'this' keyword work in JavaScript, and what are the rules determining its value?", URL: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this", Difficulty: "Advanced"},

		// SQL Videos (10)
		{Skill: "sql", Type: "video", Title: "SQL Tutorial for Beginners", URL: "https://www.youtube.com/watch?v=HXV3zeQKqGY", Difficulty: "Beginner", Description: "FreeCodeCamp - Complete Database Course"},
		{Skill: "sql", Type: "video", Title: "Learn SQL in 1 Hour", URL: "https://www.youtube.com/watch?v=9Pzj7Aj25lw", Difficulty: "Beginner", Description: "Programming with Mosh"},
		{Skill: "sql", Type: "video", Title: "Top SQL Interview Questions", URL: "https://www.youtube.com/watch?v=G30yL2uFqSk", Difficulty: "Intermediate", Description: "Edureka - Common SQL queries"},
		{Skill: "sql", Type: "video", Title: "SQL Joins Explained", URL: "https://www.youtube.com/watch?v=9yeOJ0ZMUYw", Difficulty: "Beginner", Description: "Visual guide to SQL joins"},
		{Skill: "sql", Type: "video", Title: "Advanced SQL Tutorial", URL: "https://www.youtube.com/watch?v=j09EqFziIvg", Difficulty: "Advanced", Description: "Window Functions, CTEs, Subqueries"},
		{Skill: "sql", Type: "video", Title: "Database Design Course", URL: "https://www.youtube.com/watch?v=ztHopE5Wnpc", Difficulty: "Advanced", Description: "Normalization and Database Architecture"},
		{Skill: "sql", Type: "video", Title: "MySQL Tutorial", URL: "https://www.youtube.com/watch?v=7S_tz1z_5bA", Difficulty: "Intermediate", Description: "Programming with Mosh - MySQL"},
		{Skill: "sql", Type: "video", Title: "PostgreSQL Crash Course", URL: "https://www.youtube.com/watch?v=qw--VYLpxG4", Difficulty: "Intermediate", Description: "Learn Postgres"},
		{Skill: "sql", Type: "video", Title: "SQL Indexing", URL: "https://www.youtube.com/watch?v=fsG1XaZEa78", Difficulty: "Advanced", Description: "How indexing works in databases"},
		{Skill: "sql", Type: "video", Title: "SQL Best Practices", URL: "https://www.youtube.com/watch?v=eB1p5Bq1wWk", Difficulty: "Intermediate", Description: "Query optimization"},

		// SQL Questions
		{Skill: "sql", Type: "question", Title: "Joins", Content: "Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.", URL: "https://www.w3schools.com/sql/sql_join.asp", Difficulty: "Beginner"},
		{Skill: "sql", Type: "question", Title: "ACID Properties", Content: "What are ACID properties in a database transaction? Explain each concept.", URL: "https://www.databricks.com/glossary/acid-transactions", Difficulty: "Intermediate"},
		{Skill: "sql", Type: "question", Title: "Primary vs Foreign Key", Content: "What is the difference between a Primary Key and a Foreign Key?", URL: "https://www.javatpoint.com/primary-key-vs-foreign-key", Difficulty: "Beginner"},
		{Skill: "sql", Type: "question", Title: "Normalization", Content: "What is database normalization? Explain 1NF, 2NF, and 3NF.", URL: "https://www.studytonight.com/dbms/database-normalization.php", Difficulty: "Advanced"},
		{Skill: "sql", Type: "question", Title: "Indexes", Content: "What is an Index in SQL? How does it improve query performance and what are the drawbacks?", URL: "https://use-the-index-luke.com/", Difficulty: "Advanced"},
	}

	for _, r := range resources {
		DB.Create(&r)
	}
}
