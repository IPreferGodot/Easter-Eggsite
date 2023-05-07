EOL = "\r\n"
NEW_EOL = "EoL\n"

new_text = ""

with open("raw_assets/easter_eggs.csv", "r", encoding="utf-8", newline='') as file:
    for line in file:
        # print(repr(line[-2:]))
        if line.endswith(EOL):
            line = line.removesuffix(EOL)
            line += NEW_EOL
        new_text += line
    
with open("docs/assets/easter_eggs.csv", "w", encoding="utf-8", newline='') as file:
    print(repr(new_text))
    file.write(new_text)