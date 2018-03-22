package main

import (
	"../controllers"

	"fmt"
)

func main() {
	str, err := controllers.GetMusicByName("周杰伦", 0)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(str)
}
