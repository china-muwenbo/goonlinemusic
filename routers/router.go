package routers

import (

	"github.com/astaxie/beego"
	"goonlinemusic/controllers"
)

func Init() {
    beego.Router("/", &controllers.MainController{})
    beego.Router("/getMusic", &controllers.GetMusicController{})
}
