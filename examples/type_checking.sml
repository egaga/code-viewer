fun length (xs:string list) :int =
    case xs of
        [] => 0:int
        | x::rest => (1 + length rest:int)

val l = length ["1", "2", "3"]

(*
val x = 5

fun foobar y = 10 * x

val result = foobar 2

fun thermometer (temp: int) : string =
    if temp < 37
    then "Cold"
    else if temp > 37
         then "hei"
         else "Normal"

val hei = thermometer 5 10
*)
(* fun bar (x: int list): int list = x *)

(* the above = fun bar x: int list = x *)

(*
fun bar (x:int) (y:string) :int = x
val res0 = bar 5 "hey"
*)