package main
import (
	"../models"
	//"fmt"
	"fmt"
)

func main() {
	fmt.Println(	models.HasCached("周杰伦1"))
	models.AddCached("薛之谦")
	}
