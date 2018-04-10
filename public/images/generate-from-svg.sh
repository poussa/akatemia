#!/bin/bash

# manifest icons
for i in {48,72,96,144,192,512}
do
    rsvg-convert -h $i noun_8715.svg --background-color=white > manifest/noun_8715-${i}x${i}.png
done

# favicon.ico icons
for i in {16,32}
do
    rsvg-convert -h $i noun_8715.svg > noun_8715-${i}x${i}.png
done
convert noun_8715-16x16.png noun_8715-32x32.png favicon.ico
