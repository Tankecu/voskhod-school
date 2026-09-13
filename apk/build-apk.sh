#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# VOSKHOD Orbit — сборка подписанного APK без Gradle.
# Инструменты: JDK + build-tools + platform android.jar.
# Ожидает распакованные тулчейны в /d/rep/apk-build/
# Результат: /d/rep/voskhod/app/dist/voskhod-orbit.apk
# ═══════════════════════════════════════════════════════════
set -e

SRC="$(cd "$(dirname "$0")" && pwd)"      # /d/rep/voskhod/apk
WORK=/d/rep/apk-build
JDK=$(ls -d $WORK/jdk/jdk-*/ | head -1)
BT=$WORK/bt/android-14
JAR=$WORK/plat/android-34/android.jar
KS=$WORK/keystore.jks

export PATH="$JDK/bin:$PATH"

echo "── JDK:   $JDK"
echo "── tools: $BT"
echo "── jar:   $JAR"

BUILD=$WORK/build
rm -rf "$BUILD"
mkdir -p "$BUILD/gen" "$BUILD/classes" "$BUILD/dex" "$SRC/../app/dist"

echo "── [1/6] aapt2 compile"
"$BT/aapt2.exe" compile --dir "$SRC/res" -o "$BUILD/res.zip"

echo "── [2/6] aapt2 link"
"$BT/aapt2.exe" link -o "$BUILD/base.apk" -I "$JAR" \
  --manifest "$SRC/AndroidManifest.xml" \
  --java "$BUILD/gen" --auto-add-overlay "$BUILD/res.zip"

echo "── [3/6] javac"
javac -source 1.8 -target 1.8 -nowarn \
  -classpath "$JAR" \
  -d "$BUILD/classes" \
  "$BUILD/gen/com/voskhod/orbit/R.java" \
  "$SRC/java/com/voskhod/orbit/MainActivity.java"

echo "── [4/6] d8 (dex)"
"$BT/d8.bat" --release --lib "$JAR" --output "$BUILD/dex" \
  $(find "$BUILD/classes" -name '*.class')

echo "── [5/6] упаковка classes.dex + zipalign"
python - "$BUILD/base.apk" "$BUILD/dex/classes.dex" "$BUILD/unsigned.apk" <<'PY'
import sys, zipfile, shutil
src, dex, dst = sys.argv[1], sys.argv[2], sys.argv[3]
shutil.copyfile(src, dst)
with zipfile.ZipFile(dst, 'a', zipfile.ZIP_DEFLATED) as z:
    z.write(dex, 'classes.dex')
print('packed', dst)
PY

"$BT/zipalign.exe" -f -p 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"

echo "── [6/6] подпись"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias voskhod \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass voskhod-orbit -keypass voskhod-orbit \
    -dname "CN=VOSKHOD Orbit, O=VOSKHOD School, C=UZ"
fi

"$BT/apksigner.bat" sign \
  --ks "$KS" --ks-pass pass:voskhod-orbit --key-pass pass:voskhod-orbit \
  --out "$SRC/../app/dist/voskhod-orbit.apk" "$BUILD/aligned.apk"

"$BT/apksigner.bat" verify --verbose "$SRC/../app/dist/voskhod-orbit.apk" | head -8
ls -la "$SRC/../app/dist/"
echo "── ГОТОВО: app/dist/voskhod-orbit.apk"
