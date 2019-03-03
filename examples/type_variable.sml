fun makeList (x: 'a) (y: 'a) = x :: y :: []
val mOk = makeList 1 2
val mWrong = makeList 1 "foo"

(*
same type variable bound in one call must be same

fun makeList (x: 'a, y: 'a) = [x, y]
val mWrong = makeList 1 "foo"
val mOk = makeList 1 2

fun length (xs : 'a list) :int =
    case xs of
        [] => 0:int
        | x::rest => (1 + length rest:int)

val foo = length [1, 2, 3]

fun foo x = x
fun foo (x: 'a): 'a = x

fun foo x = x type should be fn: 'a -> 'a *)