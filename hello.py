#console output is in file text.txt

STATS = ["Number of moves", "Max tile", "Avg time per move", 
	"Total Time for this run", "Number of moves", "Score"]

for i in range(len(STATS)): STATS[i] = STATS[i] + ": "

num_STATS = len(STATS)

sums = [0,0,0,0,0,0]
count = 0 

if __name__ == "__main__":
    with open('Text.txt', 'rU') as f:
        for line in f:
        	if "game over" in line:
    			count +=1
        	for i in range(len(STATS)):
        		if STATS[i] in line:
    				number = float(line.rsplit(STATS[i])[1])
    				sums[i] += float(number)
    	print "count is " + str(count)
    	for i in range(len(STATS)):
	    	print "average " + STATS[i] + str(sums[i] / count) 
 


