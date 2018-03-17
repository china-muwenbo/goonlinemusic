package main

import (
	_ "test/routers"
	"github.com/astaxie/beego"
	"goonlinemusic/routers"
)

func main() {
	routers.Init()
	beego.SetStaticPath("/static", "static")
	beego.Run()
}

